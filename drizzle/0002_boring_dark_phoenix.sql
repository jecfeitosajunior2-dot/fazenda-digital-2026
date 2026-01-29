CREATE TABLE `animais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fazendaId` int NOT NULL,
	`identificacao` varchar(50) NOT NULL,
	`raca` varchar(100),
	`sexo` enum('macho','femea') NOT NULL,
	`dataNascimento` timestamp,
	`pesoAtual` decimal(8,2),
	`status` enum('ativo','vendido','morto') NOT NULL DEFAULT 'ativo',
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `animais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assinaturas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planoId` int NOT NULL,
	`status` enum('ativa','cancelada','expirada','trial') NOT NULL DEFAULT 'trial',
	`dataInicio` timestamp NOT NULL,
	`dataFim` timestamp,
	`renovacaoAutomatica` enum('sim','nao') NOT NULL DEFAULT 'sim',
	`metodoPagamento` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assinaturas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fazendaId` int NOT NULL,
	`categoria` enum('alimentacao','veterinario','manutencao','mao_de_obra','outros') NOT NULL,
	`descricao` varchar(300) NOT NULL,
	`valor` decimal(12,2) NOT NULL,
	`dataCusto` timestamp NOT NULL,
	`fornecedor` varchar(200),
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fazendas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(200) NOT NULL,
	`localizacao` varchar(300),
	`area` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fazendas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metricas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`evento` varchar(100) NOT NULL,
	`dados` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `metricas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pagamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assinaturaId` int NOT NULL,
	`valor` decimal(10,2) NOT NULL,
	`status` enum('pendente','aprovado','recusado','estornado') NOT NULL DEFAULT 'pendente',
	`metodoPagamento` varchar(50) NOT NULL,
	`transacaoId` varchar(200),
	`dataPagamento` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pagamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(100) NOT NULL,
	`descricao` text,
	`precoMensal` decimal(10,2) NOT NULL,
	`precoAnual` decimal(10,2),
	`limiteAnimais` int,
	`limiteVendas` int,
	`features` json NOT NULL,
	`ativo` enum('sim','nao') NOT NULL DEFAULT 'sim',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fazendaId` int NOT NULL,
	`animalId` int,
	`comprador` varchar(200) NOT NULL,
	`quantidade` int NOT NULL,
	`pesoTotal` decimal(10,2),
	`valorTotal` decimal(12,2) NOT NULL,
	`valorPorKg` decimal(8,2),
	`dataVenda` timestamp NOT NULL,
	`formaPagamento` varchar(50),
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendas_id` PRIMARY KEY(`id`)
);
