@smoke @local @export
Feature: C2148 - Should not change the content of existing fields

    Background:
        Given I am logged in

    Scenario: Data imported correctly
        Given plugin is installed 'previous_stable'
        And plugin is activated
        And I disabled all settings
        And I save settings 'cache' 'cacheLoggedUser'
        And I export data '1'
        And I enable all settings
        When I import data
        Then data is imported correctly

    Scenario: Data exported correctly on previous version
        Given I disabled all settings
        And I save settings 'media' 'lazyload'
        When I export data '2'
        Then data '2' is exported correctly

    Scenario: Data exported correctly on latest version
        Given I updated plugin to 'new_release'
        And I disabled all settings
        And I save settings 'media' 'lazyload'
        When I export data '3'
        Then data '3' is exported correctly

    Scenario: Compare exported data
        Then I must not see changes in exported files
    
    Scenario: Visit homepage and other page
        When I log out
        And I visit site url
        And I go to 'hello-world'
        And I log in
        Then I must not see any error in debug.log
        Then clean up