@smoke @local @setup
Feature: C1205 - Enabling all WP Rocket features should not throw any fatal errors

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated

    Scenario: Enable all features
        When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I enable all settings
        And I log out
        Then page loads successfully
        When I log in
        Then I must not see any error in debug.log