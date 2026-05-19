@setup @smoke @brokenlinks @requires-clean-imagify
Feature: Broken links in WP Rocket settings UI

  Scenario: WP Rocket settings links are not broken
    Given I am logged in
    And plugin is installed 'new_release'
    And plugin is activated
    Then WP Rocket settings links are not broken
