// Papéis de conta possíveis. O campo User.papel é uma String no banco (o
// provider sqlite do Prisma não suporta enum nativo) — este tipo evita que os
// valores válidos fiquem espalhados como literais soltos pelo código.
export type Papel = 'USER' | 'ADMIN'
