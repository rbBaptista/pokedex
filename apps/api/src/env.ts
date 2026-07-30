// Lê uma variável de ambiente obrigatória, falhando cedo (com uma mensagem
// clara) se ela não estiver definida — em vez de seguir com `undefined` e
// quebrar de um jeito confuso mais tarde (ex: JWT assinado com a string
// literal "undefined", ou conexão com banco vazia).
export function exigirEnv(nome: string): string {
  const valor = process.env[nome]
  if (!valor) {
    throw new Error(
      `Variável de ambiente ${nome} não definida. Confira o arquivo .env (veja .env.example).`,
    )
  }
  return valor
}
