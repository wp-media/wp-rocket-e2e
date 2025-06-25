Feature: Should be able to setup other storage

  Background:
    Given I am logged in
    And I delete backwpup plugin
    And plugin is installed 'backwpup-pro'
    And plugin is activated

  Scenario: Setup Microsoft Azure Storage
    And I go '/wp-admin/admin.php?page=backwpup'
    When I click '.js-backwpup-onboarding-step-2' button to continue
    And I click '.js-backwpup-onboarding-step-3' button to continue
    When I Configure web server storage
    And I go '/wp-admin/admin.php?page=backwpup'
    And I should see 'mixed' job cards
    And I clicked on 'msazure' storage button