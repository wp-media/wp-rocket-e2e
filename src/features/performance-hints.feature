@setup
Feature: Clear lcp/performance hints data tests

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated

    Scenario: C16387 - Should clear performance hints data when click clear PH in admin bar
        And performance hints data added to DB 
        When clear performance hints is clicked in admin bar
        Then data is removed from the performance hints tables

    @hints
    Scenario: C16389 Should clear performance hints when change permalinks
        And performance hints data added to DB 
        When permalink is changed
        Then data is removed from the performance hints tables