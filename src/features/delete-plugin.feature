Feature: Should successfully delete the plugin

    Background:
        Given I am logged in

    Scenario: WP Rocket is installed but not activated
        Given plugin is installed
        When I delete plugin
        Then plugin should delete successfully
        But no error in debug.log

    Scenario: WP Rocket is installed and activated
        Given plugin is installed
        And plugin is activated
        When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And all settings is enabled
        And I delete plugin
        Then plugin should delete successfully
        But no error in debug.log