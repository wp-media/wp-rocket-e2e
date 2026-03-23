@setup @smoke @qm
Feature: C16919 - Should have no error in query monitor when activating WPR

  Background:
    Given I am logged in

  Scenario: Activate WP Rocket on latest WordPress
    Given WP is latest WP
    And Query monitor is active
    When plugin is installed 'new_release'
    And plugin is activated
    Then no PHP error in query monitor about WPR
    And no doing it wrong for WPR