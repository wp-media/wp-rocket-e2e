@bwpsetup @bwponboarding
Feature: BackWpUp Onboarding

  Background:
    Given I am logged in
    And plugin is installed 'backwpup-pro'
    And plugin is activated

  Scenario: Onboarding Pro version
    And I go '/wp-admin/admin.php?page=backwpup'
    When I click '.js-backwpup-onboarding-step-2' button to continue
    And I click '.js-backwpup-onboarding-step-3' button to continue
    When I Configure web server storage
    And I go '/wp-admin/admin.php?page=backwpup'