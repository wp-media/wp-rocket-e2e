@bwupsetup @bwponboarding
Feature: BackWpUp Onboarding

  Background:
    Given I am logged in
    And I delete backwpup plugin
    And plugin is installed 'backwpup-pro'
    And plugin is activated

  Scenario: Onboarding For Mixed data
    And I go '/wp-admin/admin.php?page=backwpup'
    When I click '.js-backwpup-onboarding-step-2' button to continue
    And I click '.js-backwpup-onboarding-step-3' button to continue
    When I Configure web server storage
    And I go '/wp-admin/admin.php?page=backwpup'
    And I should see 'mixed' job cards
    Then the backup should be added to the table

  Scenario: Onboarding with separate frequency
    And I go '/wp-admin/admin.php?page=backwpup'
    When I click '.js-backwpup-onboarding-step-2' button to continue
    And I set 'files' backup frequency to 'weekly'
    And I set 'database' backup frequency to 'daily'
    And I click '.js-backwpup-onboarding-step-3' button to continue
    When I Configure web server storage
    And I go '/wp-admin/admin.php?page=backwpup'
    And I should see 'both' job cards

  Scenario: Onboarding with Advanced frequency settings
    And I go '/wp-admin/admin.php?page=backwpup'
    When I click '.js-backwpup-onboarding-step-2' button to continue
    And I set 'files' backup frequency to 'daily'
    And I set 'database' backup frequency to 'weekly'
    And I click '.js-backwpup-onboarding-step-3' button to continue
    When I Configure web server storage
    And I go '/wp-admin/admin.php?page=backwpup'
    And I should see 'both' job cards
