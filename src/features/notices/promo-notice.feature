@promo @setup @notices
Feature: Promo Notice

  Background:
    Given I am logged in
    And auto renew is disabled
    And promo is active
    And creation date is old


  Scenario Outline: Should display promo banner for different license types
    Given "<licenseType>" license is active
    And license is 'not_expired'
    And plugin is installed 'new_release'
    And plugin is activated
    When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
    Then promo banner is displayed
    Examples:
      | licenseType |
      | single      |
      | plus        |
      | multi_50    |
      | multi_100   |
  