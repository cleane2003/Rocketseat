import { FastifyInstance } from "fastify";
import { prisma } from "./lib/prisma";
import { z } from 'zod';
import dayjs from "dayjs";

export async function appRoutes(app: FastifyInstance) {
    app.post('/habits', async (request) => {
        const createHabit = z.object({
            title: z.string(),
            weekDays: z.array(
                z.number().min(0).max(6)
            )
        })

        const { title, weekDays } = createHabit.parse(request.body)

        const today = dayjs().startOf('day').toDate()

        await prisma.habit.create({
            data: {
                title,
                created_at: today,
                weekDays: {
                    create: weekDays.map(weekDay => {
                        return {
                            week_day: weekDay
                        }
                    })
                }
            }
        });
    }) 

    app.get('/day', async (request) => {
        const getDayParams = z.object({
            // coerce está convertendo string em data
            date: z.coerce.date() 
        })

        const { date } = getDayParams.parse(request.query);

        const weekDay = dayjs(date).get('day')

        const possibleHabits = await prisma.habit.findMany({
            where: {
                created_at: {
                    lte: date,
                },
                weekDays: {
                    some: {
                        week_day: weekDay,
                    }
                }
            }
        })

        return {
            possibleHabits,
        }
    })

}

