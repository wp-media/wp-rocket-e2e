@smoke @online
Feature: C11513 - Should not cause fatal error when upgrade from 3.10.9 to latest version while using PHP 8.1.6 while beacon is open

    Background:
        Given I am logged in

    Scenario: With version 3.10.9 Installed
        Given plugin 3.10.9 is installed
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#file_optimization'
        And rucss beacon is opened

    Scenario: Update to latest version
        When I update to latest version
        And I go to 'wp-admin/options-general.php?page=wprocket#file_optimization'
        And rucss beacon is opened
        And I go through rucss beacon
        Then I must not see any error in debug.log

    Scenario: Downngrade to last stable version
        When I downgrade to the last stable version
        And I go to 'wp-admin/options-general.php?page=wprocket#file_optimization'
        And rucss beacon is opened
        And I go through rucss beacon
        Then I must not see any error in debug.log
        Then clean up