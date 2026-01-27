CREATE TABLE `calibrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stationId` int NOT NULL,
	`version` int NOT NULL,
	`paramsJson` json NOT NULL,
	`notes` text,
	`status` enum('active','archived','testing') NOT NULL DEFAULT 'active',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calibrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cameras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`rtspUrl` varchar(500) NOT NULL,
	`type` enum('rtsp','onvif','rgb','depth') NOT NULL DEFAULT 'rtsp',
	`status` enum('online','offline','error') NOT NULL DEFAULT 'offline',
	`lastSeenAt` timestamp,
	`roiConfig` json,
	`position` varchar(20),
	`penId` int,
	`weighStationId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cameras_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pen_counts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`penId` int NOT NULL,
	`cameraId` int NOT NULL,
	`count` int NOT NULL,
	`aggregatedCount` int,
	`confidence` decimal(5,4),
	`capturedAt` timestamp NOT NULL,
	`metaJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pen_counts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`location` varchar(200),
	`dimensions` varchar(50),
	`maxCapacity` int,
	`aggregationRule` enum('principal','median','sum','max') NOT NULL DEFAULT 'median',
	`primaryCameraId` int,
	`status` enum('active','inactive','maintenance') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vision_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('camera_connect','camera_disconnect','count_update','weight_estimate','calibration_update','error','warning','info') NOT NULL,
	`cameraId` int,
	`penId` int,
	`stationId` int,
	`message` text NOT NULL,
	`dataJson` json,
	`severity` enum('debug','info','warning','error','critical') NOT NULL DEFAULT 'info',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vision_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weigh_stations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`cameraId` int,
	`cameraType` enum('rgb','depth') NOT NULL DEFAULT 'rgb',
	`config` json,
	`currentCalibrationVersion` int,
	`status` enum('active','inactive','calibrating') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weigh_stations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weight_estimates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stationId` int NOT NULL,
	`estimatedKg` decimal(8,2) NOT NULL,
	`confidence` decimal(5,4) NOT NULL,
	`capturedAt` timestamp NOT NULL,
	`calibrationVersion` int NOT NULL,
	`metaJson` json,
	`animalId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weight_estimates_id` PRIMARY KEY(`id`)
);
