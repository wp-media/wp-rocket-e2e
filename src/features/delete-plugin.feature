@smoke @local @general
Feature: C4466 - Should successfully delete the plugin

    Background:
        Given I am logged in

    Scenario: WP Rocket is installed but not activated
        Given plugin is installed 'new_release'
        When I delete plugin
        Then plugin should delete successfully
        But I must not see any error in debug.log

    Scenario: WP Rocket is installed and activated
        Given plugin is installed 'new_release'
        And plugin is activated
        When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I enable all settings
        And I delete plugin
        Then plugin should delete successfully
        Then I must not see any error in debug.log
        