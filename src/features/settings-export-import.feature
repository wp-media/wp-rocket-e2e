@smoke @local @export @setup 
Feature: C2148 - Should not change the content of existing fields

    Background:
        Given I am logged in

    Scenario: Data imported correctly
        Given plugin is installed 'previous_stable'
        And plugin is activated
        And I disabled all settings
        And I export data '1'
        And I enable all settings
        When I import data
        Then data is imported correctly

    Scenario: Data exported correctly on previous version
        Given plugin is installed 'previous_stable'
        And plugin is activated
        Given I disabled all settings
        When I export data '2'
        Then data '2' is exported correctly

    Scenario: Data exported correctly on latest version
        Given plugin is installed 'previous_stable'
        And plugin is activated
        And I disabled all settings
        And I updated plugin to 'new_release'
        And I save settings 'media' 'lazyload'
        When I export data '3'
        Then data '3' is exported correctly
        Then Nothing changed in settings '3' compared to '2'
    
    Scenario: Visit homepage and other page
        Given plugin is installed 'new_release'
        And plugin is activated
        When I log out
        And I visit site url
        And I go to 'hello-world'
        And I am logged in
        Then I must not see any error in debug.log

    Scenario: Should not change enabled fields with update
        Given plugin is installed 'previous_stable'
        And plugin is activated
        And I enable all settings
        And I save all settings
        And I export data '51'
        When I updated plugin to 'new_release'
        And I go to 'wp-admin/options-general.php?page=wprocket#file_optimization'
        And I save all settings
        And I export data '52'
        Then Nothing changed in settings '52' compared to '51'
