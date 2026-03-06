import bcryptjs from 'bcryptjs'

export const hash = (text: string, saltRound: number = Number(process.env.SALT_ROUND || 10)) =>
    bcryptjs.hashSync(text, saltRound)

export const compareHash = (text: string, hash: string) =>
    bcryptjs.compareSync(text, hash)


