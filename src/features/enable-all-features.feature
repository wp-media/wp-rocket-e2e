Feature: Enabling all WP Rocket features should not throw any fatal errors

    Background:
        Given I am logged in
        And plugin is installed
        And plugin is activated

    Scenario: Enable all features
        When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And all settings is enabled
        And I log out
        And I visit site url
        Then page loads successfully
        But no error in debug.log