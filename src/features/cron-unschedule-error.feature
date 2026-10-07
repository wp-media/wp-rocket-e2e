@smoke @local @setup @cronunschedule
Feature: C20907 - Should guard against Cron unschedule event error for hook

    Background:
        Given I am logged in
        And debug.log is checkpointed
        And plugin is installed 'new_release'
        And plugin is activated

    Scenario: No cron unschedule error for WP Rocket hooks during the plugin lifecycle
        When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        Then I must not see cron event errors for WP Rocket hooks in debug.log
        When preload is finished
        Then I must not see cron event errors for WP Rocket hooks in debug.log
        When I clear priority elements
        And I visit some pages as a visitor
        Then I must not see cron event errors for WP Rocket hooks in debug.log
        When I visit some pages as a logged in subscriber
        Then I must not see cron event errors for WP Rocket hooks in debug.log
        And I must not see any error in debug.log
