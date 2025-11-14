@bwpup @bwpupsetup @bwpupwpcli
Feature: Should list BackWPup jobs via WP-CLI

  Background:
    Given I am logged in
    And I delete backwpup plugin
    And plugin is installed 'backwpup-pro'
    And plugin is activated

  Scenario: Should list the only one job via WP-CLI
    And I go '/wp-admin/admin.php?page=backwpup'
    When I click '.js-backwpup-onboarding-step-2' button to continue
    And I click '.js-backwpup-onboarding-step-3' button to continue
    When I Configure web server storage
    And I go '/wp-admin/admin.php?page=backwpup'
    And I should see 'mixed' job cards
    Then I can see 1 job via WP-CLI command

  Scenario: Should list jobs via WP-CLI
    And I go '/wp-admin/admin.php?page=backwpup'
    When I click '.js-backwpup-onboarding-step-2' button to continue
    And I click '.js-backwpup-onboarding-step-3' button to continue
    When I Configure web server storage
    And I go '/wp-admin/admin.php?page=backwpup'
    And I should see 'mixed' job cards
    Then I create one job
    And I create one job
    Then I can see 3 jobs via WP-CLI command