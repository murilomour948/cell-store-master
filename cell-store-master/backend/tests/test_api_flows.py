import os
import unittest
from unittest import mock

from backend import app as backend_app


def _clone_rows(rows):
    return [dict(row) for row in rows]


class FakeCursor:
    def __init__(self, rows=None):
        self._rows = _clone_rows(rows or [])

    def fetchone(self):
        if not self._rows:
            return None
        return dict(self._rows[0])

    def fetchall(self):
        return _clone_rows(self._rows)


class FakeDBState:
    def __init__(self):
        self.tables = {
            "usuarios": {},
            "sessions": {},
            "produtos": {},
            "acessorios": {},
            "scooters": {},
            "vendas": {},
            "clientes": {},
            "assistencias": {},
            "fornecedores": {},
        }
        self.tables["usuarios"]["1"] = {
            "id": "1",
            "user": "admin",
            "pass": backend_app.generate_password_hash("admin_test_123"),
            "role": "ADMIN",
            "ativo": 1,
            "tentativas": 0,
            "must_change_pass": 0,
            "created_at": 1710000000,
        }

    def insert(self, table, row):
        self.tables[table][str(row["id"])] = dict(row)

    def get(self, table, row_id):
        row = self.tables[table].get(str(row_id))
        return dict(row) if row else None

    def delete(self, table, row_id):
        self.tables[table].pop(str(row_id), None)

    def list_rows(self, table):
        return _clone_rows(self.tables[table].values())

    def seed_product(self, **overrides):
        row = {
            "id": "prod-1",
            "modelo": "iPhone 15",
            "imei": "111222333444555",
            "precocusto": "3500",
            "precovenda": "4999.9",
            "dataentrada": "2026-04-12",
            "cor": "Preto",
            "condicao": "Novo",
            "imagem": "",
        }
        row.update(overrides)
        self.insert("produtos", row)
        return row

    def seed_accessory(self, **overrides):
        row = {
            "id": "acc-1",
            "nome": "Capa MagSafe",
            "quantidade": 5,
            "precocusto": "40",
            "precovenda": "99.9",
            "categoria": "Capas",
        }
        row.update(overrides)
        self.insert("acessorios", row)
        return row

    def seed_scooter(self, **overrides):
        row = {
            "id": "scooter-1",
            "marca": "Xiaomi",
            "submarca": "Mi",
            "numeropeca": "PEC-01",
            "modelo": "Scooter Pro 2",
            "fabricante": "Xiaomi",
            "tipoproduto": "Patinete",
            "asin": "ASIN-1",
            "potencia": "600W",
            "precocusto": "1800",
            "precovenda": "2999.9",
            "quantidade": 2,
            "dataentrada": "2026-04-12",
            "imagem": "",
        }
        row.update(overrides)
        self.insert("scooters", row)
        return row


class FakeConnection:
    def __init__(self, state):
        self.state = state

    def _normalized_sql(self, query):
        return " ".join(query.strip().split()).lower()

    def execute(self, query, params=None):
        sql = self._normalized_sql(query)
        params = params or ()

        if sql == 'select * from usuarios where lower("user") = lower(%s)':
            username = str(params[0]).lower()
            rows = [row for row in self.state.list_rows("usuarios") if row["user"].lower() == username]
            return FakeCursor(rows)

        if sql == "select * from usuarios where id = %s":
            row = self.state.get("usuarios", params[0])
            return FakeCursor([row] if row else [])

        if sql == "update usuarios set tentativas = 0 where id = %s":
            row = self.state.tables["usuarios"][str(params[0])]
            row["tentativas"] = 0
            return FakeCursor()

        if sql.startswith("insert into sessions"):
            row = {
                "id": params[0],
                "user_id": params[1],
                "token_hash": params[2],
                "created_at": params[3],
                "expires_at": params[4],
                "revoked": 0,
            }
            self.state.insert("sessions", row)
            return FakeCursor()

        if sql == "select user_id from sessions where token_hash = %s and revoked = 0 and expires_at > %s":
            token_hash, now_ts = params
            rows = [
                {"user_id": row["user_id"]}
                for row in self.state.list_rows("sessions")
                if row["token_hash"] == token_hash and row["revoked"] == 0 and row["expires_at"] > now_ts
            ]
            return FakeCursor(rows)

        if sql == "select * from produtos where id = %s":
            row = self.state.get("produtos", params[0])
            return FakeCursor([row] if row else [])

        if sql == "select * from acessorios where id = %s":
            row = self.state.get("acessorios", params[0])
            return FakeCursor([row] if row else [])

        if sql == "select * from scooters where id = %s":
            row = self.state.get("scooters", params[0])
            return FakeCursor([row] if row else [])

        if sql == "delete from produtos where id = %s":
            self.state.delete("produtos", params[0])
            return FakeCursor()

        if sql == "update acessorios set quantidade = %s where id = %s":
            row = self.state.tables["acessorios"][str(params[1])]
            row["quantidade"] = params[0]
            return FakeCursor()

        if sql == "update scooters set quantidade = %s where id = %s":
            row = self.state.tables["scooters"][str(params[1])]
            row["quantidade"] = params[0]
            return FakeCursor()

        if sql.startswith("insert into vendas"):
            row = {
                "id": params[0],
                "modelo": params[1],
                "nome": params[2],
                "tipo": params[3],
                "cliente": params[4],
                "cpf": params[5],
                "telefone": params[6],
                "precovenda": params[7],
                "datavenda": params[8],
                "timestamp": params[9],
                "imei": params[10],
                "imagem": params[11],
                "quantidade": params[12],
                "formapagamento": params[13],
                "subtotal": params[14],
                "desconto": params[15],
                "total": params[16],
                "precounitario": params[17],
                "precocusto": params[18],
                "origemcliente": params[19],
                "descontopercentual": params[20],
                "taxapagamentopercentual": params[21],
                "observacao": params[22],
            }
            self.state.insert("vendas", row)
            return FakeCursor()

        if sql == "select * from vendas":
            return FakeCursor(self.state.list_rows("vendas"))

        if sql == "delete from vendas where id = %s":
            self.state.delete("vendas", params[0])
            return FakeCursor()

        if sql.startswith("insert into clientes"):
            row = {
                "id": params[0],
                "nome": params[1],
                "cpf": params[2],
                "telefone": params[3],
                "origem": params[4],
                "endereco": params[5],
                "totalgasto": params[6],
                "qtdcompras": params[7],
                "primeiracompra": params[8],
                "ultimacompra": params[9],
                "datanascimento": params[10],
            }
            self.state.insert("clientes", row)
            return FakeCursor()

        if sql == "select * from clientes":
            return FakeCursor(self.state.list_rows("clientes"))

        if sql == "update clientes set nome=%s, cpf=%s, telefone=%s, origem=%s, endereco=%s, totalgasto=%s, qtdcompras=%s, primeiracompra=%s, ultimacompra=%s, datanascimento=%s where id=%s":
            row = self.state.tables["clientes"][str(params[10])]
            row.update({
                "nome": params[0],
                "cpf": params[1],
                "telefone": params[2],
                "origem": params[3],
                "endereco": params[4],
                "totalgasto": params[5],
                "qtdcompras": params[6],
                "primeiracompra": params[7],
                "ultimacompra": params[8],
                "datanascimento": params[9],
            })
            return FakeCursor()

        if sql in {"delete from clientes where id=%s", "delete from clientes where id = %s"}:
            self.state.delete("clientes", params[0])
            return FakeCursor()

        if sql.startswith("insert into assistencias"):
            row = {
                "id": params[0],
                "os": params[1],
                "cliente": params[2],
                "telefone": params[3],
                "cpf": params[4],
                "endereco": params[5],
                "aparelho": params[6],
                "imei": params[7],
                "defeito": params[8],
                "status": params[9],
                "preco": params[10],
                "custopeca": params[11],
                "diasgarantia": params[12],
                "dataentrada": params[13],
                "prazoentrega": params[14],
                "observacoes": params[15],
                "datagarantia": params[16],
                "data": params[17],
                "checklist": params[18],
                "createdat": params[19],
                "updatedat": params[20],
            }
            self.state.insert("assistencias", row)
            return FakeCursor()

        if sql == "select * from assistencias order by updatedat desc, createdat desc":
            rows = sorted(
                self.state.list_rows("assistencias"),
                key=lambda row: (row.get("updatedat", 0), row.get("createdat", 0)),
                reverse=True,
            )
            return FakeCursor(rows)

        if sql == "select * from assistencias where id = %s":
            row = self.state.get("assistencias", params[0])
            return FakeCursor([row] if row else [])

        if sql.startswith("update assistencias set"):
            row = self.state.tables["assistencias"][str(params[19])]
            row.update({
                "os": params[0],
                "cliente": params[1],
                "telefone": params[2],
                "cpf": params[3],
                "endereco": params[4],
                "aparelho": params[5],
                "imei": params[6],
                "defeito": params[7],
                "status": params[8],
                "preco": params[9],
                "custopeca": params[10],
                "diasgarantia": params[11],
                "dataentrada": params[12],
                "prazoentrega": params[13],
                "observacoes": params[14],
                "datagarantia": params[15],
                "data": params[16],
                "checklist": params[17],
                "updatedat": params[18],
            })
            return FakeCursor()

        if sql == "delete from assistencias where id = %s":
            self.state.delete("assistencias", params[0])
            return FakeCursor()

        if sql.startswith("insert into fornecedores"):
            row = {
                "id": params[0],
                "nome": params[1],
                "categoria": params[2],
                "telefone": params[3],
                "createdat": params[4],
                "updatedat": params[5],
            }
            self.state.insert("fornecedores", row)
            return FakeCursor()

        if sql == "select * from fornecedores order by nome asc":
            rows = sorted(self.state.list_rows("fornecedores"), key=lambda row: row.get("nome", ""))
            return FakeCursor(rows)

        if sql == "select * from fornecedores where id = %s":
            row = self.state.get("fornecedores", params[0])
            return FakeCursor([row] if row else [])

        if sql == "update fornecedores set nome=%s, categoria=%s, telefone=%s, updatedat=%s where id=%s":
            row = self.state.tables["fornecedores"][str(params[4])]
            row.update({
                "nome": params[0],
                "categoria": params[1],
                "telefone": params[2],
                "updatedat": params[3],
            })
            return FakeCursor()

        if sql == "delete from fornecedores where id = %s":
            self.state.delete("fornecedores", params[0])
            return FakeCursor()

        raise AssertionError(f"Unsupported SQL in test fake DB: {query}")

    def commit(self):
        return None

    def rollback(self):
        return None

    def close(self):
        return None


class BackendApiFlowTests(unittest.TestCase):
    def setUp(self):
        self.state = FakeDBState()
        self.db_patch = mock.patch.object(
            backend_app,
            "get_db_connection",
            side_effect=lambda: FakeConnection(self.state),
        )
        self.env_patch = mock.patch.dict(os.environ, {"ENABLE_DEBUG_DB": ""}, clear=False)
        self.db_patch.start()
        self.env_patch.start()
        backend_app.app.config.update(TESTING=True)
        self.client = backend_app.app.test_client()

    def tearDown(self):
        self.env_patch.stop()
        self.db_patch.stop()

    def login(self):
        response = self.client.post("/api/login", json={"user": "admin", "pass": "admin_test_123"})
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        return {"Authorization": f"Bearer {payload['token']}"}

    def test_auth_and_debug_are_protected(self):
        unauthorized = self.client.get("/api/vendas")
        self.assertEqual(unauthorized.status_code, 401)
        self.assertEqual(unauthorized.get_json()["error"], "UNAUTHORIZED")

        headers = self.login()
        debug_response = self.client.get("/api/debug-db", headers=headers)
        self.assertEqual(debug_response.status_code, 404)
        self.assertEqual(debug_response.get_json()["error"], "NOT_FOUND")

    def test_checkout_updates_inventory_and_persists_sales(self):
        self.state.seed_product()
        self.state.seed_accessory()
        self.state.seed_scooter()
        headers = self.login()

        iphone_response = self.client.post(
            "/api/checkout",
            headers=headers,
            json={
                "itemId": "prod-1",
                "itemType": "IPHONE",
                "quantidade": 1,
                "cliente": "Maria",
                "cpf": "12345678909",
                "telefone": "11999990000",
                "formaPagamento": "PIX",
                "subtotal": 4999.9,
                "desconto": 199.9,
                "total": 4800.0,
                "precoUnitario": 4999.9,
                "origemCliente": "Instagram",
            },
        )
        self.assertEqual(iphone_response.status_code, 200)
        iphone_payload = iphone_response.get_json()
        self.assertTrue(iphone_payload["success"])
        self.assertEqual(iphone_payload["sale"]["precoVenda"], "4999.9")
        self.assertEqual(iphone_payload["sale"]["precoCusto"], "3500")
        self.assertNotIn("prod-1", self.state.tables["produtos"])

        insufficient = self.client.post(
            "/api/checkout",
            headers=headers,
            json={"itemId": "acc-1", "itemType": "ACESSORIO", "quantidade": 99, "cliente": "Teste"},
        )
        self.assertEqual(insufficient.status_code, 409)
        self.assertEqual(insufficient.get_json()["error"], "INSUFFICIENT_STOCK")

        accessory_response = self.client.post(
            "/api/checkout",
            headers=headers,
            json={
                "itemId": "acc-1",
                "itemType": "ACESSORIO",
                "quantidade": 2,
                "cliente": "Joao",
                "cpf": "98765432100",
                "telefone": "11888887777",
                "formaPagamento": "CREDITO",
                "subtotal": 199.8,
                "desconto": 19.8,
                "total": 180.0,
                "precoUnitario": 99.9,
                "origemCliente": "Balcao",
                "descontoPercentual": 9.91,
                "taxaPagamentoPercentual": 3.49,
            },
        )
        self.assertEqual(accessory_response.status_code, 200)
        self.assertEqual(self.state.tables["acessorios"]["acc-1"]["quantidade"], 3)

        scooter_response = self.client.post(
            "/api/checkout",
            headers=headers,
            json={
                "itemId": "scooter-1",
                "itemType": "SCOOTER",
                "quantidade": 1,
                "cliente": "Carlos",
                "cpf": "11122233344",
                "telefone": "11777776666",
                "formaPagamento": "DEBITO",
                "subtotal": 2999.9,
                "desconto": 0,
                "total": 2999.9,
                "precoUnitario": 2999.9,
                "origemCliente": "Marketplace",
                "taxaPagamentoPercentual": 1.99,
            },
        )
        self.assertEqual(scooter_response.status_code, 200)
        self.assertEqual(self.state.tables["scooters"]["scooter-1"]["quantidade"], 1)

        vendas_response = self.client.get("/api/vendas", headers=headers)
        self.assertEqual(vendas_response.status_code, 200)
        vendas = vendas_response.get_json()
        self.assertEqual(len(vendas), 3)
        vendas_por_id = {venda["id"]: venda for venda in vendas}
        self.assertEqual(vendas_por_id["prod-1"]["precoVenda"], "4999.9")
        self.assertEqual(vendas_por_id["acc-1"]["precoVenda"], "99.9")
        self.assertEqual(vendas_por_id["scooter-1"]["precoVenda"], "2999.9")

    def test_service_sales_and_customer_crud(self):
        headers = self.login()

        venda_response = self.client.post(
            "/api/vendas",
            headers=headers,
            json={
                "id": "servico-1",
                "modelo": "Troca de Tela",
                "nome": "OS 123",
                "tipo": "ASSISTENCIA",
                "cliente": "Ana",
                "cpf": "22233344455",
                "telefone": "11666665555",
                "precoVenda": "450",
                "precoCusto": "150",
                "dataVenda": "2026-04-12",
                "timestamp": 1775950000,
                "quantidade": 1,
                "formaPagamento": "PIX",
                "subtotal": 450,
                "desconto": 0,
                "total": 450,
                "precoUnitario": 450,
                "origemCliente": "Google",
            },
        )
        self.assertEqual(venda_response.status_code, 200)
        self.assertEqual(venda_response.get_json()["sale"]["cpf"], "222.333.444-55")

        create_client = self.client.post(
            "/api/clientes",
            headers=headers,
            json={
                "id": "cliente-1",
                "nome": "Julia Real",
                "cpf": "33344455566",
                "telefone": "(11) 95555-4444",
                "origem": "Indicacao",
                "endereco": "Rua A, 123",
                "totalGasto": 1200,
                "qtdCompras": 2,
                "primeiraCompra": "2026-01-10",
                "ultimaCompra": "2026-04-12",
                "dataNascimento": "1995-05-20",
            },
        )
        self.assertEqual(create_client.status_code, 200)
        self.assertEqual(create_client.get_json()["client"]["cpf"], "333.444.555-66")

        update_client = self.client.put(
            "/api/clientes/cliente-1",
            headers=headers,
            json={
                "nome": "Julia Real",
                "cpf": "33344455566",
                "telefone": "(11) 95555-4444",
                "origem": "WhatsApp",
                "endereco": "Rua B, 456",
                "totalGasto": 1800,
                "qtdCompras": 3,
                "primeiraCompra": "2026-01-10",
                "ultimaCompra": "2026-04-12",
                "dataNascimento": "1995-05-20",
            },
        )
        self.assertEqual(update_client.status_code, 200)
        self.assertEqual(update_client.get_json()["client"]["origem"], "WhatsApp")

        clientes_response = self.client.get("/api/clientes", headers=headers)
        self.assertEqual(clientes_response.status_code, 200)
        clientes = clientes_response.get_json()
        self.assertEqual(len(clientes), 1)
        self.assertEqual(clientes[0]["cpf"], "333.444.555-66")
        self.assertEqual(clientes[0]["origem"], "WhatsApp")

    def test_assistencia_crud(self):
        headers = self.login()

        create_response = self.client.post(
            "/api/assistencias",
            headers=headers,
            json={
                "id": "os-1",
                "os": "OS-9001",
                "cliente": "Maria Teste",
                "telefone": "(11) 99999-0000",
                "cpf": "12345678909",
                "endereco": "Rua das Flores 10",
                "aparelho": "iPhone 14 Pro",
                "imei": "999888777666555",
                "defeito": "Troca de tela",
                "status": "peca",
                "preco": "R$ 750,00",
                "custoPeca": "R$ 280,00",
                "diasGarantia": "120",
                "dataEntrada": "2026-04-12",
                "prazoEntrega": "2026-04-15",
                "observacoes": "Face ID ok",
                "dataGarantia": "2026-08-10T12:00:00.000Z",
                "data": "12/04/2026",
                "checklist": {
                    "telaRiscada": True,
                    "carcacaAmassada": False,
                    "faceIdRuim": True,
                    "cameraMancha": False,
                },
            },
        )
        self.assertEqual(create_response.status_code, 200)
        self.assertEqual(create_response.get_json()["assistencia"]["cliente"], "MARIA TESTE")

        list_response = self.client.get("/api/assistencias", headers=headers)
        self.assertEqual(list_response.status_code, 200)
        items = list_response.get_json()
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["custoPeca"], "R$ 280,00")
        self.assertEqual(items[0]["checklist"]["faceIdRuim"], True)

        update_response = self.client.put(
            "/api/assistencias/os-1",
            headers=headers,
            json={
                "status": "pronto",
                "preco": "R$ 800,00",
                "checklist": {
                    "telaRiscada": True,
                    "carcacaAmassada": True,
                    "faceIdRuim": False,
                    "cameraMancha": True,
                },
            },
        )
        self.assertEqual(update_response.status_code, 200)
        updated = update_response.get_json()["assistencia"]
        self.assertEqual(updated["status"], "pronto")
        self.assertEqual(updated["checklist"]["cameraMancha"], True)

        delete_response = self.client.delete("/api/assistencias/os-1", headers=headers)
        self.assertEqual(delete_response.status_code, 200)
        self.assertEqual(self.client.get("/api/assistencias", headers=headers).get_json(), [])

    def test_fornecedor_crud(self):
        headers = self.login()

        create_response = self.client.post(
            "/api/fornecedores",
            headers=headers,
            json={
                "id": "forn-1",
                "nome": "Mega Eletronicos SP",
                "categoria": "Aparelhos",
                "telefone": "(11) 98888-7777",
            },
        )
        self.assertEqual(create_response.status_code, 200)
        self.assertEqual(create_response.get_json()["fornecedor"]["nome"], "MEGA ELETRONICOS SP")

        list_response = self.client.get("/api/fornecedores", headers=headers)
        self.assertEqual(list_response.status_code, 200)
        fornecedores = list_response.get_json()
        self.assertEqual(len(fornecedores), 1)
        self.assertEqual(fornecedores[0]["categoria"], "Aparelhos")

        update_response = self.client.put(
            "/api/fornecedores/forn-1",
            headers=headers,
            json={"categoria": "Peças", "telefone": "(11) 97777-6666"},
        )
        self.assertEqual(update_response.status_code, 200)
        updated = update_response.get_json()["fornecedor"]
        self.assertEqual(updated["telefone"], "(11) 97777-6666")

        delete_response = self.client.delete("/api/fornecedores/forn-1", headers=headers)
        self.assertEqual(delete_response.status_code, 200)
        self.assertEqual(self.client.get("/api/fornecedores", headers=headers).get_json(), [])


if __name__ == "__main__":
    unittest.main()
