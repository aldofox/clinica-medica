![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-ESM-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql&logoColor=white)
# ClínicaSaúde

Aplicação web para apresentar a clínica, localizar especialidades e profissionais,
gerenciar consultas e oferecer uma área de autoatendimento ao paciente.

## O que existe hoje

- Página inicial com busca, especialidades, profissionais em destaque e conteúdo
  de prevenção.
- Páginas de especialidade com os profissionais cadastrados.
- Login e área do paciente, com agendamentos, notificações, edição de contato e
  alteração de senha.
- Área administrativa para dashboard, médicos, especialidades, pacientes,
  agendamentos, pagamentos registrados e auditoria.
- API Node.js/Express e banco MySQL em `backend-reference/`.

## Oportunidades para futuras seções

As propostas abaixo complementam as telas existentes. São ideias para priorização,
não funcionalidades já disponíveis.

### Prioridade alta: concluir o agendamento pelo paciente

Hoje o paciente acompanha e cancela consultas na sua área, enquanto o cadastro
de novas consultas está na área administrativa. Um fluxo público de agendamento
poderia permitir:

1. Consultar a página detalhada de um profissional.
2. Escolher uma data e um horário realmente disponível.
3. Revisar profissional, unidade, valor e forma de atendimento.
4. Confirmar a consulta e receber instruções e comprovante.

O backend deve continuar validando disponibilidade e conflitos no momento da
confirmação; a disponibilidade exibida no navegador não deve ser considerada
garantia de reserva.

### Prioridade alta: páginas institucionais e informações confiáveis

O rodapé já prevê links institucionais e serviços, mas vários ainda não levam a
conteúdo. Podem ser criadas páginas para:

- **Sobre a clínica e unidades:** equipe, endereço, acessibilidade, horários e
  orientações de chegada.
- **Contato e dúvidas frequentes:** canais reais de atendimento, preparo para
  consultas e regras de cancelamento.
- **Privacidade e termos de uso:** finalidade e tratamento de dados, direitos do
  titular e canais para solicitações conforme a LGPD.
- **Serviços e exames:** catálogo dos serviços efetivamente oferecidos, sem
  apresentar como disponível algo que a clínica ainda não oferece.

Antes de publicar, confirmar todos os telefones, endereços, horários e perfis de
redes sociais exibidos no site.

### Prioridade média: portal do profissional

Uma área autenticada para médicos poderia reunir agenda própria, confirmação ou
atualização do status de consultas e bloqueios de horários. O acesso deve ser
restrito aos pacientes e às informações necessárias para o atendimento daquele
profissional, com registro de ações relevantes.

### Prioridade média: lembretes e comunicação

Complementar as notificações internas com lembretes por e-mail ou WhatsApp,
confirmação de presença e avisos de alteração ou cancelamento. Permitir que a
pessoa escolha os canais e respeitar consentimento, descadastro e preferências
de comunicação. Evitar incluir dados clínicos em mensagens externas.

### Prioridade futura: pagamentos e comprovantes

Se houver necessidade operacional, integrar um provedor de pagamento para
processar transações, conciliar os estados e disponibilizar comprovantes.
Registrar apenas os dados estritamente necessários; não armazenar dados de
cartão no sistema. A integração requer definição de taxas, cancelamentos,
reembolsos e suporte antes de ser disponibilizada.

### Prioridade futura: atendimento remoto e documentos clínicos

Telemedicina, resultados de exames e documentos podem ampliar o autoatendimento,
mas envolvem dados sensíveis e responsabilidades clínicas. Devem ser planejados
com autenticação reforçada, autorização por perfil, armazenamento e transmissão
seguros, trilha de auditoria, política de retenção e revisão jurídica e
assistencial antes da implementação.

## Ordem sugerida

1. Completar o fluxo de agendamento e a página de detalhes do profissional.
2. Publicar contato, dúvidas frequentes, informações institucionais e
   privacidade, validando os dados reais da clínica.
3. Evoluir para lembretes e portal do profissional conforme a rotina da equipe.
4. Avaliar pagamentos, telemedicina e documentos clínicos após definir
   requisitos operacionais, de segurança e conformidade.

## Cuidados transversais

- Aplicar acessibilidade desde o início: navegação por teclado, rótulos,
  contraste, mensagens de erro compreensíveis e layout responsivo.
- Proteger dados pessoais e de saúde conforme a LGPD, limitando coleta, acesso,
  exposição em notificações e tempo de retenção.
- Preservar validações no servidor, autorização por perfil, logs de auditoria e
  testes para os fluxos críticos.
- Medir sucesso com indicadores úteis, como conclusão de agendamentos, faltas,
  cancelamentos, tempo para encontrar um horário e solicitações ao suporte,
  usando dados agregados sempre que possível.

## Desenvolvimento

O frontend usa React, TypeScript, Vite e TanStack Router. Consulte
[`backend-reference/README.md`](./backend-reference/README.md) para configurar e
executar a API e o banco de dados.
