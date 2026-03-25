@setup @smoke @qm
Feature: C16919 - Should have no error in query monitor when activating WPR

  Background:
    Given I am logged in

  Scenario: Activate WP Rocket on latest WordPress
    Given WordPress core is up to date
    And Query monitor is active
    When plugin is installed 'new_release'
    And plugin is activated
    Then Query monitor shows no WP Rocket errors or warnings