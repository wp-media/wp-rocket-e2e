@bwupsetup @bwupsmoke
Feature: Should be able to backup

  Background:
    Given I am logged in
    And I delete backwpup plugin
    And plugin is installed 'backwpup-pro'
    And plugin is activated

  Scenario: Should common backup now generate files&DB locally
    And I go '/wp-admin/admin.php?page=backwpup'
    When I click '.js-backwpup-onboarding-step-2' button to continue
    And I click '.js-backwpup-onboarding-step-3' button to continue
    When I Configure web server storage
    And I go '/wp-admin/admin.php?page=backwpup'
    And I should see 'mixed' job cards
    Then the backup should be added to the table
    When I click on common backup now button
    And '1' backup is generated and added to history