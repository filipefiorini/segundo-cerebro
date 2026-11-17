# Política de segurança

**English summary.** Report vulnerabilities privately through the "Report a vulnerability" button in the Security tab of this repository. There is no e-mail address. Expect an answer within 48 hours; only the latest published version is supported.

## Como relatar

Use o botão "Report a vulnerability", na aba Security do repositório. O relato fica privado entre você e o mantenedor. Não existe e-mail para isso e não abra issue pública para uma falha.

Resposta em até 48 horas. A correção vale para a última versão publicada; versões anteriores não recebem correção.

## O que conta como relato

- dado pessoal de alguém dentro do repositório (nome, CPF, telefone, credencial, caminho de usuário);
- regra da Guarda contornada: uma gravação, um comando ou uma escrita em conector que a Guarda deveria barrar ou pedir confirmação, e passou;
- script do repositório que grava fora da pasta do vault.

Dúvida de uso, pedido de recurso e erro de texto vão por issue comum.

## Limites conhecidos

A Guarda confere o que o Claude grava pelas ferramentas de escrita e os comandos que ele roda. Ela não lê o texto que um comando de terminal grava por dentro (por exemplo, um script que escreve num arquivo). Isto é um limite conhecido, não uma falha a relatar.
