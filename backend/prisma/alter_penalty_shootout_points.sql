ALTER TABLE `matches`
  ADD COLUMN `penaltyShootoutWinner` VARCHAR(64) NULL AFTER `team2Score`;

ALTER TABLE `predictions`
  ADD COLUMN `penaltyShootoutWinner` VARCHAR(64) NULL AFTER `team2Score`;

ALTER TABLE `results`
  ADD COLUMN `predictedPenaltyShootoutWinner` VARCHAR(64) NULL AFTER `team2PredictedScore`,
  ADD COLUMN `actualPenaltyShootoutWinner` VARCHAR(64) NULL AFTER `predictedPenaltyShootoutWinner`,
  ADD COLUMN `penaltyShootoutPoints` INT NOT NULL DEFAULT 0 AFTER `actualPenaltyShootoutWinner`;
