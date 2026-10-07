# WP Rocket helper plugins (https://github.com/wp-media/wp-rocket-helpers) most suggested by support.
# Helpers are not on WordPress.org: they must be pre-installed (inactive) on the e2e environment.
# Start with these and extend the list up to ~10 helpers.
@setup @wpr-helper-compatibility
Feature: C426 - WP Rocket helper plugins should not cause a PHP fatal error alongside WP Rocket

    Background:
        Given I am logged in
        And plugin is installed 'previous_stable'
        And plugin is activated

    Scenario Outline: Shouldn't cause fatal error when updating WPR with helper "<plugin>" active
        Given the WP Rocket helper "<plugin>" is pre-installed and activated
        And I updated plugin to 'new_release'
        And I visit 'wp-admin/options-general.php?page=wprocket#dashboard' and it must load successfully
        And The WP Rocket dashboard is displayed
        And I log out
        And I visit '' and it must load successfully
        Then I must not see any error in debug.log

        Examples:
            | plugin                        |
            | wp-rocket-change-parameters   |
            | wp-rocket-modify-used-css     |
            | wp-rocket-disable-page-cache  |
            | wp-rocket-no-cache-auto-purge |
