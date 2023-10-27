/* Replace with your SQL commands */

CREATE TABLE `features` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `disabled` int DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `customer_feature_junction` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `feature_id` int NOT NULL,
  `disabled` int DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id_FK_idx` (`customer_id`),
  CONSTRAINT `customer_id_FK` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  KEY `feature_id_FK_idx` (`feature_id`),
  CONSTRAINT `feature_id_FK` FOREIGN KEY (`feature_id`) REFERENCES `features` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


INSERT INTO
    features (name, disabled, created_at, updated_at)
VALUES
    ('BNPL', 0, now(), now());