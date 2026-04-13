from backend.migrations.base import Migration


def _table_has_column(conn, table_name, column_name):
    row = conn.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = %s AND column_name = %s
        """,
        (table_name, column_name.lower()),
    ).fetchone()
    return bool(row)


def apply(conn):
    conn.execute(
        '''
        CREATE TABLE IF NOT EXISTS produtos (
            id TEXT PRIMARY KEY,
            modelo TEXT,
            imei TEXT,
            precoCusto TEXT,
            precoVenda TEXT,
            dataEntrada TEXT,
            cor TEXT,
            condicao TEXT,
            imagem TEXT
        )
        '''
    )
    conn.execute(
        '''
        CREATE TABLE IF NOT EXISTS acessorios (
            id TEXT PRIMARY KEY,
            nome TEXT,
            quantidade INTEGER,
            precoCusto TEXT,
            precoVenda TEXT,
            categoria TEXT
        )
        '''
    )
    conn.execute(
        '''
        CREATE TABLE IF NOT EXISTS scooters (
            id TEXT PRIMARY KEY,
            marca TEXT,
            submarca TEXT,
            numeroPeca TEXT,
            modelo TEXT,
            fabricante TEXT,
            tipoProduto TEXT,
            asin TEXT,
            potencia TEXT,
            precoCusto TEXT,
            precoVenda TEXT,
            quantidade INTEGER,
            dataEntrada TEXT,
            imagem TEXT
        )
        '''
    )
    conn.execute(
        '''
        CREATE TABLE IF NOT EXISTS vendas (
            id TEXT PRIMARY KEY,
            modelo TEXT,
            nome TEXT,
            tipo TEXT,
            cliente TEXT,
            cpf TEXT,
            telefone TEXT,
            precoVenda TEXT,
            dataVenda TEXT,
            timestamp BIGINT,
            imei TEXT,
            imagem TEXT,
            quantidade INTEGER,
            formaPagamento TEXT,
            subtotal REAL,
            desconto REAL,
            total REAL,
            precoUnitario REAL,
            precoCusto TEXT,
            origemCliente TEXT,
            descontoPercentual REAL,
            taxaPagamentoPercentual REAL,
            observacao TEXT
        )
        '''
    )
    conn.execute(
        '''
        CREATE TABLE IF NOT EXISTS logs (
            id TEXT PRIMARY KEY,
            mensagem TEXT,
            data TEXT,
            tipo TEXT,
            timestamp BIGINT,
            usuario TEXT
        )
        '''
    )
    conn.execute(
        '''
        CREATE TABLE IF NOT EXISTS clientes (
            id TEXT PRIMARY KEY,
            nome TEXT,
            cpf TEXT,
            telefone TEXT,
            origem TEXT,
            endereco TEXT,
            totalGasto REAL,
            qtdCompras INTEGER,
            primeiraCompra TEXT,
            ultimaCompra TEXT,
            dataNascimento TEXT
        )
        '''
    )
    conn.execute(
        '''
        CREATE TABLE IF NOT EXISTS assistencias (
            id TEXT PRIMARY KEY,
            os TEXT,
            cliente TEXT,
            telefone TEXT,
            cpf TEXT,
            endereco TEXT,
            aparelho TEXT,
            imei TEXT,
            defeito TEXT,
            status TEXT,
            preco TEXT,
            custoPeca TEXT,
            diasGarantia TEXT,
            dataEntrada TEXT,
            prazoEntrega TEXT,
            observacoes TEXT,
            dataGarantia TEXT,
            data TEXT,
            checklist TEXT,
            createdAt BIGINT,
            updatedAt BIGINT
        )
        '''
    )
    conn.execute(
        '''
        CREATE TABLE IF NOT EXISTS fornecedores (
            id TEXT PRIMARY KEY,
            nome TEXT,
            categoria TEXT,
            telefone TEXT,
            createdAt BIGINT,
            updatedAt BIGINT
        )
        '''
    )
    conn.execute(
        '''
        CREATE TABLE IF NOT EXISTS despesas (
            id TEXT PRIMARY KEY,
            descricao TEXT,
            valor TEXT,
            categoria TEXT,
            data TEXT
        )
        '''
    )
    conn.execute(
        '''
        CREATE TABLE IF NOT EXISTS usuarios (
            id TEXT PRIMARY KEY,
            "user" TEXT,
            pass TEXT,
            role TEXT,
            ativo INTEGER DEFAULT 1,
            tentativas INTEGER DEFAULT 0,
            must_change_pass INTEGER DEFAULT 0,
            created_at BIGINT
        )
        '''
    )
    conn.execute(
        '''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            token_hash TEXT,
            created_at BIGINT,
            expires_at BIGINT,
            revoked INTEGER DEFAULT 0
        )
        '''
    )

    alter_steps = [
        ("usuarios", "ativo", "ALTER TABLE usuarios ADD COLUMN ativo INTEGER DEFAULT 1"),
        ("usuarios", "tentativas", "ALTER TABLE usuarios ADD COLUMN tentativas INTEGER DEFAULT 0"),
        ("usuarios", "must_change_pass", "ALTER TABLE usuarios ADD COLUMN must_change_pass INTEGER DEFAULT 0"),
        ("usuarios", "created_at", "ALTER TABLE usuarios ADD COLUMN created_at BIGINT"),
        ("sessions", "revoked", "ALTER TABLE sessions ADD COLUMN revoked INTEGER DEFAULT 0"),
        ("clientes", "dataNascimento", "ALTER TABLE clientes ADD COLUMN dataNascimento TEXT"),
        ("clientes", "cpf", "ALTER TABLE clientes ADD COLUMN cpf TEXT"),
        ("clientes", "origem", "ALTER TABLE clientes ADD COLUMN origem TEXT"),
        ("clientes", "endereco", "ALTER TABLE clientes ADD COLUMN endereco TEXT"),
        ("scooters", "imagem", "ALTER TABLE scooters ADD COLUMN imagem TEXT"),
        ("scooters", "potencia", "ALTER TABLE scooters ADD COLUMN potencia TEXT"),
        ("vendas", "imagem", "ALTER TABLE vendas ADD COLUMN imagem TEXT"),
        ("vendas", "quantidade", "ALTER TABLE vendas ADD COLUMN quantidade INTEGER"),
        ("vendas", "cpf", "ALTER TABLE vendas ADD COLUMN cpf TEXT"),
        ("vendas", "formaPagamento", "ALTER TABLE vendas ADD COLUMN formaPagamento TEXT"),
        ("vendas", "subtotal", "ALTER TABLE vendas ADD COLUMN subtotal REAL"),
        ("vendas", "desconto", "ALTER TABLE vendas ADD COLUMN desconto REAL"),
        ("vendas", "total", "ALTER TABLE vendas ADD COLUMN total REAL"),
        ("vendas", "precoUnitario", "ALTER TABLE vendas ADD COLUMN precoUnitario REAL"),
        ("vendas", "precoCusto", "ALTER TABLE vendas ADD COLUMN precoCusto TEXT"),
        ("vendas", "origemCliente", "ALTER TABLE vendas ADD COLUMN origemCliente TEXT"),
        ("vendas", "descontoPercentual", "ALTER TABLE vendas ADD COLUMN descontoPercentual REAL"),
        ("vendas", "taxaPagamentoPercentual", "ALTER TABLE vendas ADD COLUMN taxaPagamentoPercentual REAL"),
        ("vendas", "observacao", "ALTER TABLE vendas ADD COLUMN observacao TEXT"),
        ("logs", "usuario", "ALTER TABLE logs ADD COLUMN usuario TEXT"),
        ("produtos", "imagem", "ALTER TABLE produtos ADD COLUMN imagem TEXT"),
    ]

    for table_name, column_name, query in alter_steps:
        if not _table_has_column(conn, table_name, column_name):
            conn.execute(query)


MIGRATION = Migration(
    version="001",
    name="initial_schema",
    apply=apply,
)
