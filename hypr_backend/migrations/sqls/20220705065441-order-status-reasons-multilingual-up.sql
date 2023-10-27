/* Replace with your SQL commands */

CREATE TABLE `order_status_reason_multilingual` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `language` varchar(10) NOT NULL,
  `value` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `order_status_reason_id` int NOT NULL,
  `attribute_name` varchar(40) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_status_reason_id_FK_idx` (`order_status_reason_id`),
  CONSTRAINT `order_status_reason_fk` FOREIGN KEY (`order_status_reason_id`) REFERENCES `order_status_reason` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;