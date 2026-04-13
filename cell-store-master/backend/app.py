import os
import json
from datetime import datetime, timezone
import time
import secrets
import hashlib
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, request, jsonify, send_from_directory, g
from flask_cors import CORS

try:
    from backend.database import get_db_connection, initialize_database
except ModuleNotFoundError:
    from database import get_db_connection, initialize_database


def _resolve_cors_origins():
    raw = os.environ.get('CORS_ALLOWED_ORIGINS', '').strip()
    if not raw:
        return "*"
    origins = [item.strip() for item in raw.split(',') if item.strip()]
    return origins or "*"


app = Flask(__name__, static_folder='../frontend/build')
CORS(app, resources={r"/api/*": {"origins": _resolve_cors_origins()}})

global_init_err = "None"
try:
    initialize_database()
except Exception as e:
    import traceback
    global_init_err = traceback.format_exc()

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

def _is_password_hash(value: str) -> bool:
    if not isinstance(value, str):
        return False
    return value.startswith('pbkdf2:') or value.startswith('scrypt:') or value.startswith('argon2:')

def _sanitize_user(user: dict) -> dict:
    safe = dict(user)
    safe.pop('pass', None)
    return safe

def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth = request.headers.get('Authorization', '') or ''
        token = None
        if auth.lower().startswith('bearer '):
            token = auth[7:].strip()
        if not token:
            token = (request.headers.get('X-Auth-Token') or '').strip()
        if not token:
            return jsonify({"error": "UNAUTHORIZED"}), 401

        token_hash = _hash_token(token)
        now_ts = int(time.time())

        conn = get_db_connection()
        session_row = conn.execute(
            "SELECT user_id FROM sessions WHERE token_hash = %s AND revoked = 0 AND expires_at > %s",
            (token_hash, now_ts)
        ).fetchone()
        if not session_row:
            conn.close()
            return jsonify({"error": "UNAUTHORIZED"}), 401

        user_row = conn.execute("SELECT * FROM usuarios WHERE id = %s", (session_row['user_id'],)).fetchone()
        conn.close()
        if not user_row:
            return jsonify({"error": "UNAUTHORIZED"}), 401
        user = dict(user_row)
        if user.get('ativo') == 0:
            return jsonify({"error": "ACCOUNT_DISABLED"}), 403

        g.current_user = user
        return fn(*args, **kwargs)
    return wrapper

def require_admin(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = getattr(g, 'current_user', None) or {}
        if user.get('role') != 'ADMIN':
            return jsonify({"error": "FORBIDDEN"}), 403
        return fn(*args, **kwargs)
    return wrapper

@app.route('/api/debug-db', methods=['GET'])
@require_auth
@require_admin
def debug_db():
    if os.environ.get('ENABLE_DEBUG_DB') != '1':
        return jsonify({"error": "NOT_FOUND"}), 404

    try:
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            return jsonify({"status": "error", "message": "Sem DATABASE_URL"}), 200

        init_err = globals().get('global_init_err', 'None')

        return jsonify({
            "status": "success",
            "init_err": init_err,
            "database_url_configured": True
        }), 200

    except Exception as e:
        import traceback
        return jsonify({
            "status": "error",
            "message": str(e),
            "trace": traceback.format_exc()
        }), 200

# --- ROUTES ---

@app.route('/')
def serve():
    if os.path.exists(app.static_folder):
        return send_from_directory(app.static_folder, 'index.html')
    return jsonify({
        "status": "online",
        "message": "Backend MR ERP em Python esta rodando.",
        "api_docs": "/api/...",
        "frontend_note": "O frontend React geralmente roda separado do backend. Se desejar servi-lo por aqui, execute 'npm run build' primeiro."
    })

@app.route('/<path:path>')
def static_proxy(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return serve()

@app.route('/api/health', methods=['GET'])
def healthcheck():
    return jsonify({"status": "ok"}), 200

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('user')
    password = data.get('pass')
    
    conn = get_db_connection()
    user_row = conn.execute('SELECT * FROM usuarios WHERE LOWER("user") = LOWER(%s)', (username,)).fetchone()
    
    if not user_row:
        conn.close()
        return jsonify({"error": "INVALID_CREDENTIALS"}), 401
        
    user = dict(user_row)
    
    if user.get('ativo') == 0:
        conn.close()
        return jsonify({"error": "ACCOUNT_DISABLED"}), 403

    stored = user.get('pass') or ''
    ok = False
    if _is_password_hash(stored):
        ok = check_password_hash(stored, password or '')
    else:
        ok = stored == (password or '')
        if ok and stored:
            conn.execute("UPDATE usuarios SET pass = %s WHERE id = %s", (generate_password_hash(stored), user['id']))
            conn.commit()

    if ok:
        conn.execute("UPDATE usuarios SET tentativas = 0 WHERE id = %s", (user['id'],))
        now_ts = int(time.time())
        token = secrets.token_urlsafe(32)
        token_hash = _hash_token(token)
        expires_at = now_ts + (60 * 60 * 24 * 7)
        conn.execute(
            "INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at, revoked) VALUES (%s, %s, %s, %s, %s, 0)",
            (token_hash, user['id'], token_hash, now_ts, expires_at)
        )
        conn.commit()
        conn.close()
        safe_user = _sanitize_user(user)
        return jsonify({"user": safe_user, "token": token})
    else:
        novas_tentativas = user.get('tentativas', 0) + 1
        if novas_tentativas >= 5:
            conn.execute("UPDATE usuarios SET tentativas = %s, ativo = 0 WHERE id = %s", (novas_tentativas, user['id']))
            conn.commit()
            conn.close()
            return jsonify({"error": "ACCOUNT_BLOCKED", "tentativas": novas_tentativas}), 403
        else:
            conn.execute("UPDATE usuarios SET tentativas = %s WHERE id = %s", (novas_tentativas, user['id']))
            conn.commit()
            conn.close()
            return jsonify({"error": "INVALID_CREDENTIALS", "tentativas": novas_tentativas}), 401

@app.route('/api/logout', methods=['POST'])
@require_auth
def logout():
    auth = request.headers.get('Authorization', '') or ''
    token = None
    if auth.lower().startswith('bearer '):
        token = auth[7:].strip()
    if not token:
        token = (request.headers.get('X-Auth-Token') or '').strip()
    if not token:
        return jsonify({"success": True})
    token_hash = _hash_token(token)
    conn = get_db_connection()
    conn.execute("UPDATE sessions SET revoked = 1 WHERE token_hash = %s", (token_hash,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

def get_all(table):
    allowed = {'produtos', 'acessorios', 'scooters', 'vendas', 'logs', 'clientes', 'assistencias', 'despesas', 'usuarios'}
    if table not in allowed:
        return jsonify({"error": "INVALID_TABLE"}), 400
    conn = get_db_connection()
    rows = conn.execute(f"SELECT * FROM {table}").fetchall()
    conn.close()
    result = []
    for row in rows:
        d = dict(row)
        if table == 'usuarios':
            d.pop('pass', None)
        result.append(d)
    return jsonify(result)

def get_valid_price(data):
    keys = ['precoVenda', 'precovenda', 'valorCobrado', 'valorcobrado', 'preco']
    for key in keys:
        val = data.get(key)
        if val is not None and str(val).strip() != '':
            v_str = str(val).replace('R$', '').replace(' ', '').replace('.', '').replace(',', '.').strip()
            try:
                v_num = float(v_str)
                if v_num > 0:
                    return str(val)
            except:
                if len(v_str) > 0:
                    return str(val)
    return '0'

def _parse_float(value, default=0.0):
    if value is None or value == '':
        return default
    if isinstance(value, (int, float)):
        return float(value)
    value_str = str(value).replace('R$', '').replace(' ', '').replace('.', '').replace(',', '.').strip()
    try:
        return float(value_str)
    except (TypeError, ValueError):
        return default

def _parse_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default

def _normalize_cpf(value):
    digits = ''.join(ch for ch in str(value or '') if ch.isdigit())[:11]
    if len(digits) == 11:
        return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"
    return str(value or '').strip()

def _parse_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in {'1', 'true', 'sim', 'yes', 'on'}
    return False

def _normalize_assistencia_checklist(value):
    base = {
        "telaRiscada": False,
        "carcacaAmassada": False,
        "faceIdRuim": False,
        "cameraMancha": False
    }

    parsed = value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except (TypeError, ValueError, json.JSONDecodeError):
            parsed = {}
    if not isinstance(parsed, dict):
        parsed = {}

    normalized = dict(base)
    for key in base:
        normalized[key] = _parse_bool(parsed.get(key))
    return normalized

def _alias_row_keys(row, *camel_case_keys):
    normalized = dict(row)
    for key in camel_case_keys:
        lower_key = key.lower()
        if key not in normalized and lower_key in normalized:
            normalized[key] = normalized[lower_key]
        if lower_key != key and key in normalized and lower_key in normalized:
            normalized.pop(lower_key, None)
    return normalized

def build_sale_record(item_row, payload, item_type=None):
    normalized_item = _alias_row_keys(
        item_row or {},
        'precoVenda',
        'precoCusto',
        'dataEntrada',
        'numeroPeca',
        'tipoProduto',
        'formaPagamento',
        'precoUnitario',
        'origemCliente',
        'descontoPercentual',
        'taxaPagamentoPercentual'
    )
    sale_payload = {**normalized_item, **(payload or {})}
    quantidade = max(1, _parse_int(sale_payload.get('quantidade'), 1))
    resolved_type = str(item_type or sale_payload.get('tipoOriginal') or sale_payload.get('tipo') or '').upper()
    sale_date = sale_payload.get('dataVenda') or datetime.now(timezone.utc).isoformat()
    sale_timestamp = _parse_int(sale_payload.get('timestamp'), int(time.time() * 1000))
    sale_name = sale_payload.get('nome') or sale_payload.get('modelo') or ''
    preco_venda = get_valid_price(sale_payload)
    total = _parse_float(sale_payload.get('total'), _parse_float(preco_venda, 0))
    subtotal = _parse_float(sale_payload.get('subtotal'), total)
    desconto = _parse_float(sale_payload.get('desconto'), max(0.0, subtotal - total))
    preco_unitario = _parse_float(
        sale_payload.get('precoUnitario'),
        (total / quantidade) if quantidade else total
    )

    return {
        **sale_payload,
        "id": str(sale_payload.get('id') or int(time.time() * 1000)),
        "nome": sale_name,
        "tipo": resolved_type,
        "tipoOriginal": sale_payload.get('tipoOriginal') or resolved_type,
        "cliente": str(sale_payload.get('cliente') or '').strip(),
        "cpf": _normalize_cpf(sale_payload.get('cpf')),
        "telefone": str(sale_payload.get('telefone') or '').strip(),
        "formaPagamento": str(sale_payload.get('formaPagamento') or '').strip(),
        "subtotal": subtotal,
        "desconto": desconto,
        "total": total,
        "precoUnitario": preco_unitario,
        "precoVenda": preco_venda,
        "precoCusto": str(
            sale_payload.get('precoCusto')
            or sale_payload.get('precocusto')
            or sale_payload.get('custoPeca')
            or sale_payload.get('custo')
            or ''
        ).strip(),
        "origemCliente": str(sale_payload.get('origemCliente') or sale_payload.get('origem') or 'Balcao').strip(),
        "descontoPercentual": _parse_float(sale_payload.get('descontoPercentual'), 0),
        "taxaPagamentoPercentual": _parse_float(sale_payload.get('taxaPagamentoPercentual'), 0),
        "observacao": str(sale_payload.get('observacao') or '').strip(),
        "dataVenda": sale_date,
        "timestamp": sale_timestamp,
        "quantidade": quantidade
    }

def build_assistencia_record(payload):
    data = dict(payload or {})
    now_ts = int(time.time() * 1000)
    created_at = _parse_int(data.get('createdAt'), now_ts)
    updated_at = _parse_int(data.get('updatedAt'), now_ts)

    return {
        "id": str(data.get('id') or now_ts),
        "os": str(data.get('os') or f"OS-{str(now_ts)[-4:]}").strip(),
        "cliente": str(data.get('cliente') or '').strip().upper(),
        "telefone": str(data.get('telefone') or '').strip(),
        "cpf": _normalize_cpf(data.get('cpf')),
        "endereco": str(data.get('endereco') or '').strip().upper(),
        "aparelho": str(data.get('aparelho') or '').strip().upper(),
        "imei": str(data.get('imei') or '').strip().upper(),
        "defeito": str(data.get('defeito') or '').strip(),
        "status": str(data.get('status') or 'orcamento').strip() or 'orcamento',
        "preco": str(data.get('preco') or '').strip(),
        "custoPeca": str(data.get('custoPeca') or '').strip(),
        "diasGarantia": str(data.get('diasGarantia') or '90').strip() or '90',
        "dataEntrada": str(data.get('dataEntrada') or '').strip(),
        "prazoEntrega": str(data.get('prazoEntrega') or '').strip(),
        "observacoes": str(data.get('observacoes') or '').strip(),
        "dataGarantia": str(data.get('dataGarantia') or '').strip(),
        "data": str(data.get('data') or datetime.now().strftime('%d/%m/%Y')).strip(),
        "checklist": _normalize_assistencia_checklist(data.get('checklist')),
        "createdAt": created_at,
        "updatedAt": updated_at
    }

def serialize_assistencia_row(row):
    data = _alias_row_keys(
        row,
        'custoPeca',
        'diasGarantia',
        'dataEntrada',
        'prazoEntrega',
        'dataGarantia',
        'createdAt',
        'updatedAt'
    )
    data['cliente'] = str(data.get('cliente') or '').strip().upper()
    data['cpf'] = _normalize_cpf(data.get('cpf'))
    data['endereco'] = str(data.get('endereco') or '').strip().upper()
    data['aparelho'] = str(data.get('aparelho') or '').strip().upper()
    data['imei'] = str(data.get('imei') or '').strip().upper()
    data['status'] = str(data.get('status') or 'orcamento').strip() or 'orcamento'
    data['preco'] = str(data.get('preco') or '').strip()
    data['custoPeca'] = str(data.get('custoPeca') or '').strip()
    data['diasGarantia'] = str(data.get('diasGarantia') or '90').strip() or '90'
    data['checklist'] = _normalize_assistencia_checklist(data.get('checklist'))
    return data

def insert_assistencia(conn, assistencia_record):
    conn.execute(
        """
        INSERT INTO assistencias (
            id, os, cliente, telefone, cpf, endereco, aparelho, imei, defeito, status,
            preco, custoPeca, diasGarantia, dataEntrada, prazoEntrega, observacoes,
            dataGarantia, data, checklist, createdAt, updatedAt
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s
        )
        """,
        (
            assistencia_record['id'],
            assistencia_record['os'],
            assistencia_record['cliente'],
            assistencia_record['telefone'],
            assistencia_record['cpf'],
            assistencia_record['endereco'],
            assistencia_record['aparelho'],
            assistencia_record['imei'],
            assistencia_record['defeito'],
            assistencia_record['status'],
            assistencia_record['preco'],
            assistencia_record['custoPeca'],
            assistencia_record['diasGarantia'],
            assistencia_record['dataEntrada'],
            assistencia_record['prazoEntrega'],
            assistencia_record['observacoes'],
            assistencia_record['dataGarantia'],
            assistencia_record['data'],
            json.dumps(assistencia_record['checklist'], ensure_ascii=False),
            assistencia_record['createdAt'],
            assistencia_record['updatedAt']
        )
    )

def build_fornecedor_record(payload, existing=None):
    data = {**(existing or {}), **(payload or {})}
    now_ts = int(time.time() * 1000)
    created_at = _parse_int(data.get('createdAt'), _parse_int((existing or {}).get('createdAt'), now_ts))
    updated_at = _parse_int(data.get('updatedAt'), now_ts)

    return {
        "id": str(data.get('id') or now_ts),
        "nome": str(data.get('nome') or '').strip().upper(),
        "categoria": str(data.get('categoria') or '').strip(),
        "telefone": str(data.get('telefone') or '').strip(),
        "createdAt": created_at,
        "updatedAt": updated_at
    }

def serialize_fornecedor_row(row):
    return _alias_row_keys(row, 'createdAt', 'updatedAt')

def insert_sale(conn, sale_record):
    conn.execute(
        """
        INSERT INTO vendas (
            id, modelo, nome, tipo, cliente, cpf, telefone, precoVenda, dataVenda, timestamp,
            imei, imagem, quantidade, formaPagamento, subtotal, desconto, total, precoUnitario,
            precoCusto, origemCliente, descontoPercentual, taxaPagamentoPercentual, observacao
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s
        )
        """,
        (
            sale_record['id'],
            sale_record.get('modelo', ''),
            sale_record.get('nome', ''),
            sale_record.get('tipo', ''),
            sale_record.get('cliente', ''),
            sale_record.get('cpf', ''),
            sale_record.get('telefone', ''),
            sale_record.get('precoVenda', '0'),
            sale_record.get('dataVenda', ''),
            sale_record.get('timestamp', 0),
            sale_record.get('imei', ''),
            sale_record.get('imagem', ''),
            sale_record.get('quantidade', 1),
            sale_record.get('formaPagamento', ''),
            sale_record.get('subtotal', 0),
            sale_record.get('desconto', 0),
            sale_record.get('total', 0),
            sale_record.get('precoUnitario', 0),
            sale_record.get('precoCusto', ''),
            sale_record.get('origemCliente', 'Balcao'),
            sale_record.get('descontoPercentual', 0),
            sale_record.get('taxaPagamentoPercentual', 0),
            sale_record.get('observacao', '')
        )
    )

@app.route('/api/checkout', methods=['POST'])
@require_auth
def checkout():
    data = request.json or {}
    item_id = str(data.get('itemId', '') or '').strip()
    item_type = str(data.get('itemType') or data.get('tipoOriginal') or data.get('tipo') or '').upper()
    quantidade = max(1, _parse_int(data.get('quantidade'), 1))

    if not item_id or item_type not in {'IPHONE', 'ACESSORIO', 'SCOOTER'}:
        return jsonify({"error": "INVALID_CHECKOUT_PAYLOAD"}), 400

    conn = get_db_connection()
    try:
        item_row = None
        remaining_quantity = None

        if item_type == 'IPHONE':
            item_row = conn.execute("SELECT * FROM produtos WHERE id = %s", (item_id,)).fetchone()
            if not item_row:
                return jsonify({"error": "ITEM_NOT_FOUND"}), 404
            conn.execute("DELETE FROM produtos WHERE id = %s", (item_id,))
            remaining_quantity = 0
        elif item_type == 'ACESSORIO':
            item_row = conn.execute("SELECT * FROM acessorios WHERE id = %s", (item_id,)).fetchone()
            if not item_row:
                return jsonify({"error": "ITEM_NOT_FOUND"}), 404
            estoque_atual = _parse_int(item_row.get('quantidade'), 0)
            if estoque_atual < quantidade:
                return jsonify({"error": "INSUFFICIENT_STOCK", "available": estoque_atual}), 409
            remaining_quantity = estoque_atual - quantidade
            conn.execute("UPDATE acessorios SET quantidade = %s WHERE id = %s", (remaining_quantity, item_id))
        else:
            item_row = conn.execute("SELECT * FROM scooters WHERE id = %s", (item_id,)).fetchone()
            if not item_row:
                return jsonify({"error": "ITEM_NOT_FOUND"}), 404
            estoque_atual = _parse_int(item_row.get('quantidade'), 0)
            if estoque_atual < quantidade:
                return jsonify({"error": "INSUFFICIENT_STOCK", "available": estoque_atual}), 409
            remaining_quantity = estoque_atual - quantidade
            conn.execute("UPDATE scooters SET quantidade = %s WHERE id = %s", (remaining_quantity, item_id))

        sale_record = build_sale_record(item_row, data, item_type)
        insert_sale(conn, sale_record)
        conn.commit()

        return jsonify({
            "success": True,
            "sale": sale_record,
            "inventory": {
                "itemId": item_id,
                "itemType": item_type,
                "remainingQuantity": remaining_quantity,
                "removed": item_type == 'IPHONE'
            }
        })
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

@app.route('/api/produtos', methods=['GET', 'POST'])
@require_auth
def handle_produtos():
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json
        preco_venda = get_valid_price(data)
        conn.execute("INSERT INTO produtos (id, modelo, imei, precoCusto, precoVenda, dataEntrada, cor, condicao, imagem) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                     (data.get('id', ''), data.get('modelo', ''), data.get('imei', ''), data.get('precoCusto', '0'), preco_venda, data.get('dataEntrada', ''), data.get('cor', ''), data.get('condicao', ''), data.get('imagem', '')))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    
    rows = conn.execute("SELECT * FROM produtos").fetchall()
    conn.close()
    result = []
    for row in rows:
        d = _alias_row_keys(row, 'precoVenda', 'precoCusto', 'dataEntrada')
        preco_venda = d.get('precoVenda') or d.get('preco') or d.get('valorCobrado') or '0'
        d['precoVenda'] = preco_venda
        d['preco'] = preco_venda
        d['valorCobrado'] = preco_venda
        result.append(d)
    return jsonify(result)

@app.route('/api/produtos/<id>', methods=['DELETE', 'PUT'])
@require_auth
def handle_produto(id):
    conn = get_db_connection()
    if request.method == 'DELETE':
        conn.execute("DELETE FROM produtos WHERE id = %s", (id,))
    elif request.method == 'PUT':
        data = request.json
        preco_venda = get_valid_price(data)
        conn.execute("UPDATE produtos SET modelo=%s, imei=%s, precoCusto=%s, precoVenda=%s, cor=%s, condicao=%s, imagem=%s WHERE id=%s",
                     (data.get('modelo', ''), data.get('imei', ''), data.get('precoCusto', '0'), preco_venda, data.get('cor', ''), data.get('condicao', ''), data.get('imagem', ''), id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/acessorios', methods=['GET', 'POST'])
@require_auth
def handle_acessorios():
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json
        preco_venda = get_valid_price(data)
        conn.execute("INSERT INTO acessorios (id, nome, quantidade, precoCusto, precoVenda, categoria) VALUES (%s, %s, %s, %s, %s, %s)",
                     (data.get('id', ''), data.get('nome', ''), data.get('quantidade', 0), data.get('precoCusto', '0'), preco_venda, data.get('categoria', '')))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    
    rows = conn.execute("SELECT * FROM acessorios").fetchall()
    conn.close()
    result = []
    for row in rows:
        d = _alias_row_keys(row, 'precoVenda', 'precoCusto')
        preco_venda = d.get('precoVenda') or d.get('preco') or d.get('valorCobrado') or '0'
        d['precoVenda'] = preco_venda
        d['preco'] = preco_venda
        d['valorCobrado'] = preco_venda
        result.append(d)
    return jsonify(result)

@app.route('/api/acessorios/<id>', methods=['DELETE', 'PUT'])
@require_auth
def handle_acessorio(id):
    conn = get_db_connection()
    if request.method == 'DELETE':
        conn.execute("DELETE FROM acessorios WHERE id = %s", (id,))
    elif request.method == 'PUT':
        data = request.json
        preco_venda = get_valid_price(data)
        conn.execute("UPDATE acessorios SET nome=%s, quantidade=%s, precoCusto=%s, precoVenda=%s, categoria=%s WHERE id=%s",
                     (data.get('nome', ''), data.get('quantidade', 0), data.get('precoCusto', '0'), preco_venda, data.get('categoria', ''), id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/scooters', methods=['GET', 'POST'])
@require_auth
def handle_scooters():
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json
        preco_venda = get_valid_price(data)
        asin = data.get('asin', '')
        potencia = data.get('potencia', '') or asin
        conn.execute("INSERT INTO scooters (id, marca, submarca, numeroPeca, modelo, fabricante, tipoProduto, asin, potencia, precoCusto, precoVenda, quantidade, dataEntrada, imagem) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                     (data.get('id', ''), data.get('marca', ''), data.get('submarca', ''), data.get('numeroPeca', ''), data.get('modelo', ''), data.get('fabricante', ''), data.get('tipoProduto', ''), asin, potencia, data.get('precoCusto', '0'), preco_venda, data.get('quantidade', 0), data.get('dataEntrada', ''), data.get('imagem', '')))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    
    rows = conn.execute("SELECT * FROM scooters").fetchall()
    conn.close()
    result = []
    for row in rows:
        d = _alias_row_keys(row, 'numeroPeca', 'tipoProduto', 'precoVenda', 'precoCusto', 'dataEntrada')
        preco_venda = d.get('precoVenda') or d.get('preco') or d.get('valorCobrado') or '0'
        d['precoVenda'] = preco_venda
        d['preco'] = preco_venda
        d['valorCobrado'] = preco_venda
        result.append(d)
    return jsonify(result)

@app.route('/api/scooters/<id>', methods=['DELETE', 'PUT'])
@require_auth
def handle_scooter(id):
    conn = get_db_connection()
    if request.method == 'DELETE':
        conn.execute("DELETE FROM scooters WHERE id = %s", (id,))
    elif request.method == 'PUT':
        data = request.json
        preco_venda = get_valid_price(data)
        asin = data.get('asin', '')
        potencia = data.get('potencia', '') or asin
        conn.execute("UPDATE scooters SET marca=%s, submarca=%s, numeroPeca=%s, modelo=%s, fabricante=%s, tipoProduto=%s, asin=%s, potencia=%s, precoCusto=%s, precoVenda=%s, quantidade=%s, imagem=%s WHERE id=%s",
                     (data.get('marca', ''), data.get('submarca', ''), data.get('numeroPeca', ''), data.get('modelo', ''), data.get('fabricante', ''), data.get('tipoProduto', ''), asin, potencia, data.get('precoCusto', '0'), preco_venda, data.get('quantidade', 0), data.get('imagem', ''), id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/assistencias', methods=['GET', 'POST'])
@require_auth
def handle_assistencias():
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json or {}
        assistencia_record = build_assistencia_record(data)
        insert_assistencia(conn, assistencia_record)
        conn.commit()
        conn.close()
        return jsonify({"success": True, "assistencia": assistencia_record})

    rows = conn.execute("SELECT * FROM assistencias ORDER BY updatedat DESC, createdat DESC").fetchall()
    conn.close()
    result = [serialize_assistencia_row(row) for row in rows]
    return jsonify(result)

@app.route('/api/assistencias/<id>', methods=['PUT', 'DELETE'])
@require_auth
def update_or_delete_assistencia(id):
    conn = get_db_connection()
    if request.method == 'DELETE':
        conn.execute("DELETE FROM assistencias WHERE id = %s", (id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})

    existing_row = conn.execute("SELECT * FROM assistencias WHERE id = %s", (id,)).fetchone()
    if not existing_row:
        conn.close()
        return jsonify({"error": "ASSISTENCIA_NOT_FOUND"}), 404

    existing_data = serialize_assistencia_row(existing_row)
    payload = request.json or {}
    assistencia_record = build_assistencia_record({
        **existing_data,
        **payload,
        "id": id,
        "os": payload.get('os', existing_data.get('os')),
        "data": payload.get('data', existing_data.get('data')),
        "createdAt": existing_data.get('createdAt'),
        "updatedAt": int(time.time() * 1000)
    })
    conn.execute(
        """
        UPDATE assistencias SET
            os=%s, cliente=%s, telefone=%s, cpf=%s, endereco=%s, aparelho=%s, imei=%s, defeito=%s, status=%s,
            preco=%s, custoPeca=%s, diasGarantia=%s, dataEntrada=%s, prazoEntrega=%s, observacoes=%s,
            dataGarantia=%s, data=%s, checklist=%s, updatedAt=%s
        WHERE id=%s
        """,
        (
            assistencia_record['os'],
            assistencia_record['cliente'],
            assistencia_record['telefone'],
            assistencia_record['cpf'],
            assistencia_record['endereco'],
            assistencia_record['aparelho'],
            assistencia_record['imei'],
            assistencia_record['defeito'],
            assistencia_record['status'],
            assistencia_record['preco'],
            assistencia_record['custoPeca'],
            assistencia_record['diasGarantia'],
            assistencia_record['dataEntrada'],
            assistencia_record['prazoEntrega'],
            assistencia_record['observacoes'],
            assistencia_record['dataGarantia'],
            assistencia_record['data'],
            json.dumps(assistencia_record['checklist'], ensure_ascii=False),
            assistencia_record['updatedAt'],
            id
        )
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "assistencia": assistencia_record})

@app.route('/api/vendas', methods=['GET', 'POST'])
@require_auth
def handle_vendas():
    conn = get_db_connection()
    if request.method == 'POST':
        data = request.json or {}
        sale_record = build_sale_record(None, data)
        insert_sale(conn, sale_record)
        conn.commit()
        conn.close()
        return jsonify({"success": True, "sale": sale_record})
    
    rows = conn.execute("SELECT * FROM vendas").fetchall()
    conn.close()
    result = []
    for row in rows:
        d = _alias_row_keys(
            row,
            'precoVenda',
            'formaPagamento',
            'precoUnitario',
            'precoCusto',
            'origemCliente',
            'descontoPercentual',
            'taxaPagamentoPercentual'
        )
        preco_venda = d.get('precoVenda') or d.get('preco') or d.get('valorCobrado') or '0'
        d['precoVenda'] = preco_venda
        d['preco'] = preco_venda
        d['valorCobrado'] = preco_venda
        d['quantidade'] = d.get('quantidade', 1) or 1
        if d.get('total') in (None, ''):
            d['total'] = _parse_float(d.get('precoVenda'), 0)
        if d.get('subtotal') in (None, ''):
            d['subtotal'] = d.get('total', 0)
        if d.get('precoUnitario') in (None, ''):
            qtd = max(1, _parse_int(d.get('quantidade'), 1))
            d['precoUnitario'] = _parse_float(d.get('total'), 0) / qtd
        if d.get('desconto') in (None, ''):
            d['desconto'] = max(0.0, _parse_float(d.get('subtotal'), 0) - _parse_float(d.get('total'), 0))
        d['cpf'] = _normalize_cpf(d.get('cpf'))
        d['origemCliente'] = d.get('origemCliente') or 'Balcao'
        result.append(d)
    return jsonify(result)

@app.route('/api/vendas/<id>', methods=['DELETE'])
@require_auth
def delete_venda(id):
    conn = get_db_connection()
    conn.execute("DELETE FROM vendas WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/logs', methods=['GET', 'POST'])
@require_auth
def handle_logs():
    if request.method == 'POST':
        data = request.json
        conn = get_db_connection()
        usuario = data.get('usuario', '') or (getattr(g, 'current_user', {}) or {}).get('user', '')
        conn.execute("INSERT INTO logs (id, mensagem, data, tipo, timestamp, usuario) VALUES (%s, %s, %s, %s, %s, %s)",
                     (data.get('id', ''), data.get('mensagem', ''), data.get('data', ''), data.get('tipo', ''), data.get('timestamp', 0), usuario))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    if (getattr(g, 'current_user', {}) or {}).get('role') != 'ADMIN':
        return jsonify([]) 
    return get_all('logs')

@app.route('/api/clientes', methods=['GET', 'POST'])
@require_auth
def handle_clientes():
    if request.method == 'POST':
        data = request.json or {}
        client_record = {
            "id": str(data.get('id', '') or int(time.time() * 1000)),
            "nome": str(data.get('nome', '') or '').strip(),
            "cpf": _normalize_cpf(data.get('cpf')),
            "telefone": str(data.get('telefone', '') or '').strip(),
            "origem": str(data.get('origem', '') or '').strip(),
            "endereco": str(data.get('endereco', '') or '').strip(),
            "totalGasto": _parse_float(data.get('totalGasto'), 0),
            "qtdCompras": max(0, _parse_int(data.get('qtdCompras'), 0)),
            "primeiraCompra": data.get('primeiraCompra', ''),
            "ultimaCompra": data.get('ultimaCompra', ''),
            "dataNascimento": data.get('dataNascimento', '')
        }
        conn = get_db_connection()
        conn.execute(
            "INSERT INTO clientes (id, nome, cpf, telefone, origem, endereco, totalGasto, qtdCompras, primeiraCompra, ultimaCompra, dataNascimento) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (
                client_record['id'],
                client_record['nome'],
                client_record['cpf'],
                client_record['telefone'],
                client_record['origem'],
                client_record['endereco'],
                client_record['totalGasto'],
                client_record['qtdCompras'],
                client_record['primeiraCompra'],
                client_record['ultimaCompra'],
                client_record['dataNascimento']
            )
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True, "client": client_record})

    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM clientes").fetchall()
    conn.close()
    result = []
    for row in rows:
        d = _alias_row_keys(row, 'totalGasto', 'qtdCompras', 'primeiraCompra', 'ultimaCompra', 'dataNascimento')
        d['cpf'] = _normalize_cpf(d.get('cpf'))
        d['origem'] = d.get('origem') or ''
        result.append(d)
    return jsonify(result)

@app.route('/api/fornecedores', methods=['GET', 'POST'])
@require_auth
def handle_fornecedores():
    conn = get_db_connection()
    if request.method == 'POST':
        fornecedor_record = build_fornecedor_record(request.json or {})
        conn.execute(
            "INSERT INTO fornecedores (id, nome, categoria, telefone, createdAt, updatedAt) VALUES (%s, %s, %s, %s, %s, %s)",
            (
                fornecedor_record['id'],
                fornecedor_record['nome'],
                fornecedor_record['categoria'],
                fornecedor_record['telefone'],
                fornecedor_record['createdAt'],
                fornecedor_record['updatedAt']
            )
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True, "fornecedor": fornecedor_record})

    rows = conn.execute("SELECT * FROM fornecedores ORDER BY nome ASC").fetchall()
    conn.close()
    return jsonify([serialize_fornecedor_row(row) for row in rows])

@app.route('/api/fornecedores/<id>', methods=['PUT', 'DELETE'])
@require_auth
def update_or_delete_fornecedor(id):
    conn = get_db_connection()
    if request.method == 'DELETE':
        conn.execute("DELETE FROM fornecedores WHERE id = %s", (id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})

    existing_row = conn.execute("SELECT * FROM fornecedores WHERE id = %s", (id,)).fetchone()
    if not existing_row:
        conn.close()
        return jsonify({"error": "FORNECEDOR_NOT_FOUND"}), 404

    fornecedor_record = build_fornecedor_record(request.json or {}, serialize_fornecedor_row(existing_row))
    conn.execute(
        "UPDATE fornecedores SET nome=%s, categoria=%s, telefone=%s, updatedAt=%s WHERE id=%s",
        (
            fornecedor_record['nome'],
            fornecedor_record['categoria'],
            fornecedor_record['telefone'],
            fornecedor_record['updatedAt'],
            id
        )
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "fornecedor": fornecedor_record})

@app.route('/api/clientes/<id>', methods=['PUT', 'DELETE'])
@require_auth
def update_or_delete_cliente(id):
    if request.method == 'DELETE':
        conn = get_db_connection()
        conn.execute("DELETE FROM clientes WHERE id=%s", (id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
        
    data = request.json or {}
    client_record = {
        "nome": str(data.get('nome', '') or '').strip(),
        "cpf": _normalize_cpf(data.get('cpf')),
        "telefone": str(data.get('telefone', '') or '').strip(),
        "origem": str(data.get('origem', '') or '').strip(),
        "endereco": str(data.get('endereco', '') or '').strip(),
        "totalGasto": _parse_float(data.get('totalGasto'), 0),
        "qtdCompras": max(0, _parse_int(data.get('qtdCompras'), 0)),
        "primeiraCompra": data.get('primeiraCompra', ''),
        "ultimaCompra": data.get('ultimaCompra', ''),
        "dataNascimento": data.get('dataNascimento', '')
    }
    conn = get_db_connection()
    conn.execute(
        "UPDATE clientes SET nome=%s, cpf=%s, telefone=%s, origem=%s, endereco=%s, totalGasto=%s, qtdCompras=%s, primeiraCompra=%s, ultimaCompra=%s, dataNascimento=%s WHERE id=%s",
        (
            client_record['nome'],
            client_record['cpf'],
            client_record['telefone'],
            client_record['origem'],
            client_record['endereco'],
            client_record['totalGasto'],
            client_record['qtdCompras'],
            client_record['primeiraCompra'],
            client_record['ultimaCompra'],
            client_record['dataNascimento'],
            id
        )
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "client": {"id": id, **client_record}})

@app.route('/api/despesas', methods=['GET', 'POST'])
@require_auth
@require_admin
def handle_despesas():
    if request.method == 'POST':
        data = request.json
        conn = get_db_connection()
        conn.execute("INSERT INTO despesas (id, descricao, valor, categoria, data) VALUES (%s, %s, %s, %s, %s)",
                     (data.get('id', ''), data.get('descricao', ''), data.get('valor', '0'), data.get('categoria', ''), data.get('data', '')))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    return get_all('despesas')

@app.route('/api/despesas/<id>', methods=['DELETE'])
@require_auth
@require_admin
def delete_despesa(id):
    conn = get_db_connection()
    conn.execute("DELETE FROM despesas WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/usuarios', methods=['GET', 'POST'])
@require_auth
@require_admin
def handle_usuarios():
    if request.method == 'POST':
        data = request.json
        conn = get_db_connection()
        senha = data.get('pass', '') or ''
        conn.execute('INSERT INTO usuarios (id, "user", pass, role, ativo, tentativas, must_change_pass, created_at) VALUES (%s, %s, %s, %s, 1, 0, 0, %s)',
                     (data.get('id', ''), data.get('user', ''), generate_password_hash(senha), data.get('role', ''), int(time.time())))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    return get_all('usuarios')

@app.route('/api/usuarios/<id>/desbloquear', methods=['POST'])
@require_auth
@require_admin
def unlock_user(id):
    conn = get_db_connection()
    conn.execute("UPDATE usuarios SET tentativas = 0, ativo = 1 WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/usuarios/<id>/status', methods=['PATCH'])
@require_auth
@require_admin
def update_usuario_status(id):
    data = request.json
    conn = get_db_connection()
    if 'ativo' in data:
        conn.execute("UPDATE usuarios SET ativo=%s WHERE id=%s", (data['ativo'], id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/usuarios/<id>', methods=['PUT', 'DELETE'])
@require_auth
@require_admin
def update_usuario(id):
    conn = get_db_connection()
    if request.method == 'DELETE':
        conn.execute("DELETE FROM usuarios WHERE id = %s", (id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    
    data = request.json
    if 'ativo' in data:
        conn.execute("UPDATE usuarios SET ativo=%s WHERE id=%s", (data['ativo'], id))
    if 'pass' in data:
        conn.execute("UPDATE usuarios SET pass=%s, must_change_pass=0 WHERE id=%s", (generate_password_hash(data.get('pass', '') or ''), id))
        
    conn.commit()
    conn.close()
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        debug=os.environ.get('FLASK_DEBUG') == '1',
        port=int(os.environ.get('PORT', 5000))
    )
