-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema final
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema final
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `final` DEFAULT CHARACTER SET utf8 ;
USE `final` ;

-- -----------------------------------------------------
-- Table `final`.`member_status`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`member_status` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `final`.`family`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`family` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `final`.`member`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`member` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `middle_name` VARCHAR(45) NULL,
  `last_name_parental` VARCHAR(45) NOT NULL,
  `last_name_maternal` VARCHAR(45) NULL,
  `address` VARCHAR(45) NULL,
  `birth_date` DATE NULL,
  `gender` ENUM('M', 'F', 'Other') NOT NULL,
  `phone` VARCHAR(20) NULL,
  `email` VARCHAR(100) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `marital_status` VARCHAR(45) NULL,
  `family_role` VARCHAR(45) NULL,
  `is_baptized` TINYINT NULL,
  `baptized_location` VARCHAR(45) NULL,
  `member_status_id` INT NOT NULL,
  `family_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_member_member_status_idx` (`member_status_id` ASC) VISIBLE,
  INDEX `fk_member_family1_idx` (`family_id` ASC) VISIBLE,
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE,
  CONSTRAINT `fk_member_member_status`
    FOREIGN KEY (`member_status_id`)
    REFERENCES `final`.`member_status` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_member_family1`
    FOREIGN KEY (`family_id`)
    REFERENCES `final`.`family` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `final`.`event_series`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`event_series` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `description` TEXT NULL,
  `attendance_type` ENUM('individual', 'general') NOT NULL,
  `is_recurring` TINYINT NOT NULL,
  `recurrence_rule` TEXT NULL,
  `start_datetime` DATETIME NOT NULL,
  `end_datetime` VARCHAR(45) NOT NULL,
  `location` VARCHAR(45) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `final`.`event_instance`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`event_instance` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `start_datetime` DATETIME NOT NULL,
  `end_datetime` DATETIME NOT NULL,
  `location` VARCHAR(45) NULL,
  `event_series_id` INT NOT NULL,
  `attendee_count` INT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_event_instance_event_series1_idx` (`event_series_id` ASC) VISIBLE,
  CONSTRAINT `fk_event_instance_event_series1`
    FOREIGN KEY (`event_series_id`)
    REFERENCES `final`.`event_series` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `final`.`event_member_attendance`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`event_member_attendance` (
  `member_id` INT NOT NULL,
  `event_instance_id` INT NOT NULL,
  `status` ENUM('attended', 'absent') NOT NULL,
  PRIMARY KEY (`member_id`, `event_instance_id`),
  INDEX `fk_member_has_event_instance_event_instance1_idx` (`event_instance_id` ASC) VISIBLE,
  INDEX `fk_member_has_event_instance_member1_idx` (`member_id` ASC) VISIBLE,
  CONSTRAINT `fk_member_has_event_instance_member1`
    FOREIGN KEY (`member_id`)
    REFERENCES `final`.`member` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_member_has_event_instance_event_instance1`
    FOREIGN KEY (`event_instance_id`)
    REFERENCES `final`.`event_instance` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `final`.`event_tag`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`event_tag` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `color` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `final`.`event_series_tag_map`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`event_series_tag_map` (
  `event_tag_id` INT NOT NULL,
  `event_series_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_tag_id`, `event_series_id`),
  INDEX `fk_event_tag_has_event_series_event_series1_idx` (`event_series_id` ASC) VISIBLE,
  INDEX `fk_event_tag_has_event_series_event_tag1_idx` (`event_tag_id` ASC) VISIBLE,
  CONSTRAINT `fk_event_tag_has_event_series_event_tag1`
    FOREIGN KEY (`event_tag_id`)
    REFERENCES `final`.`event_tag` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_event_tag_has_event_series_event_series1`
    FOREIGN KEY (`event_series_id`)
    REFERENCES `final`.`event_series` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `final`.`small_group`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`small_group` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `description` VARCHAR(45) NULL,
  `meeting_day` VARCHAR(45) NOT NULL,
  `meeting_time` TIME NOT NULL,
  `location` VARCHAR(45) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `final`.`group_membership`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`group_membership` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `small_group_id` INT NOT NULL,
  `member_id` INT NOT NULL,
  `joined_at` DATE NOT NULL,
  `left_at` DATE NULL,
  `role` ENUM('member', 'leader', 'assistant') NOT NULL,
  INDEX `fk_small_group_has_member_member1_idx` (`member_id` ASC) VISIBLE,
  INDEX `fk_small_group_has_member_small_group1_idx` (`small_group_id` ASC) VISIBLE,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_small_group_has_member_small_group1`
    FOREIGN KEY (`small_group_id`)
    REFERENCES `final`.`small_group` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_small_group_has_member_member1`
    FOREIGN KEY (`member_id`)
    REFERENCES `final`.`member` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `final`.`small_group_tag`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`small_group_tag` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `color` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `final`.`small_group_tag_map`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`small_group_tag_map` (
  `group_tag_id` INT NOT NULL,
  `small_group_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `fk_group_tag_has_small_group_small_group1_idx` (`small_group_id` ASC) VISIBLE,
  INDEX `fk_group_tag_has_small_group_group_tag1_idx` (`group_tag_id` ASC) VISIBLE,
  CONSTRAINT `fk_group_tag_has_small_group_group_tag1`
    FOREIGN KEY (`group_tag_id`)
    REFERENCES `final`.`small_group_tag` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_group_tag_has_small_group_small_group1`
    FOREIGN KEY (`small_group_id`)
    REFERENCES `final`.`small_group` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `final`.`attendance_group`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`attendance_group` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `description` VARCHAR(100) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `final`.`event_instance_group_count`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`event_instance_group_count` (
  `attendance_group_id` INT NOT NULL,
  `event_instance_id` INT NOT NULL,
  `count` INT NOT NULL,
  PRIMARY KEY (`attendance_group_id`, `event_instance_id`),
  INDEX `fk_event_series_has_grupuos_grupuos1_idx` (`attendance_group_id` ASC) VISIBLE,
  INDEX `fk_event_series_has_grupuos_event_instance1_idx` (`event_instance_id` ASC) VISIBLE,
  CONSTRAINT `fk_event_series_has_grupuos_grupuos1`
    FOREIGN KEY (`attendance_group_id`)
    REFERENCES `final`.`attendance_group` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_event_series_has_grupuos_event_instance1`
    FOREIGN KEY (`event_instance_id`)
    REFERENCES `final`.`event_instance` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `final`.`user_account`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`user_account` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `last_login` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `final`.`user_logs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `final`.`user_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_account_id` INT NOT NULL,
  `action_type` VARCHAR(45) NOT NULL,
  `description` VARCHAR(100) NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_user_logs_user_account1`
    FOREIGN KEY (`user_account_id`)
    REFERENCES `final`.`user_account` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
