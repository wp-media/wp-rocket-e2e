@smoke @local @setup @updatebanner
Feature: C22325 - Should successfully update from latest to latest+1

    Background:
        Given I am logged in
        And plugin is installed 'previous_stable'
        And plugin is activated

    Scenario: Update WP Rocket from the plugins list update banner
        Given 'new_release' is offered as a WP Rocket update
        When I go to 'wp-admin/plugins.php'
        Then I should see the WP Rocket update banner
        When I update WP Rocket from the update banner
        Then WP Rocket should be updated to 'new_release'
        And I must not see any error in debug.log
