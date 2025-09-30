import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from 'prisma/generated';

@Injectable()
export class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, Prisma.LogLevel> implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name)

    constructor() {
        super({
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'stdout', level: 'info' },
                { emit: 'stdout', level: 'warn' },
                { emit: 'stdout', level: 'error' },
            ],
            errorFormat: 'pretty'
        })
    }

    async onModuleInit() {
        await this.$connect()
    }

    async onModuleDestroy() {
        await this.$disconnect()
    }

    log() {
        this.$on('query', (event) => {
            this.logger.log(`[Duration]: ${event.duration} ms`)
            this.logger.log(`[Timestamp]: ${event.timestamp}`)
            this.logger.log(`[Query]: ${event.query}`)
        })
    }

}
