@online @setup
Feature: C11513 - Should not cause fatal error when upgrade from previous version to latest version while using PHP 8.1.6 while beacon is open

    Background:
        Given I am logged in

    Scenario: With previous version Installed
        Given plugin is installed 'previous_stable'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#file_optimization'
        And rucss beacon is opened

    Scenario: Update to latest version
        Given plugin is installed 'previous_stable'
        And plugin is activated
        And I updated plugin to 'new_release'
        And I go to 'wp-admin/options-general.php?page=wprocket#file_optimization'
        And rucss beacon is opened
        And I go through rucss beacon
        Then I must not see any error in debug.log

    Scenario: Downngrade to last stable version
        Given plugin is installed 'new_release'
        And plugin is activated
        And I updated plugin to 'previous_stable'
        And I go to 'wp-admin/options-general.php?page=wprocket#file_optimization'
        And rucss beacon is opened
        And I go through rucss beacon
        Then I must not see any error in debug.log