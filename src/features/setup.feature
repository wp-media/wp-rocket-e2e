@healthcheck
Feature: Check if CLI is running

  Scenario: Check CLI commands
    Given wp cli is running
    Then page loads successfully
    When I log in
    And I log out