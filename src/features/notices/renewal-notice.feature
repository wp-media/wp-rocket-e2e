@renewal @setup @notices
Feature: Renewal Notice

  Background:
    Given I am logged in
    And auto renew is disabled


  Scenario Outline: Should display expiring soon renew banner for different license types
    Given "<licenseType>" license is active
    And license is 'expiring_soon'
    And plugin is installed 'new_release'
    And plugin is activated
    When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
    Then expiring soon banner is displayed
    Examples:
      | licenseType |
      | single      |
      | plus        |
      | multi_50    |
      | multi_100   |
      | multi_500   |


  Scenario Outline: Should display expired renew banner for different license types
    Given "<licenseType>" license is active
    And license is 'expired'
    And plugin is installed 'new_release'
    And plugin is activated
    When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
    Then expired banner is displayed
    Examples:
      | licenseType |
      | single      |
      | plus        |
      | multi_50    |
      | multi_100   |
      | multi_500   |
