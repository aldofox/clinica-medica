ALTER TABLE consultas
  ADD COLUMN forma_pagamento ENUM('pix','cartao_credito','convenio') NULL
    AFTER observacoes,
  ADD COLUMN status_pagamento ENUM('pendente','pago','vencido')
    NOT NULL DEFAULT 'pendente'
    AFTER forma_pagamento,
  ADD COLUMN valor_consulta DECIMAL(10,2) NULL
    AFTER status_pagamento;
