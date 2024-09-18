@setup @performancehints
Feature: Clear lcp/performance hints data tests

    Background:
        Given I am logged in
        And I install plugin 'https://github.com/wp-media/wp-rocket-e2e-test-helper/raw/main/helper-plugin/rocket-disable-ph-saas-visit.zip'
        And plugin 'rocket-disable-ph-saas-visit' is activated
        And plugin is installed 'new_release'
        And plugin is activated

    Scenario: C16387 - Should clear performance hints data when click clear PH in admin bar
        Given performance hints data added to DB
        When clear performance hints is clicked in admin bar
        Then data is removed from the performance hints tables
  
    Scenario: C16389 - Should clear performance hints when change permalinks
        Given performance hints data added to DB
        When permalink structure is changed to '/%postname%'
        Then data is removed from the performance hints tables
    
    Scenario: C16390 - Should clear performance hints when switch theme
        Given performance hints data added to DB
        And switching the theme
        Then data is removed from the performance hints tables
        Then theme 'Twenty Twenty' is activated

    Scenario: Should clear performance hints of the current URL
        Given I log out
        And I visit beacon driven page 'atf-lrc-1' with browser dimension 1600 x 700
        And I visit beacon driven page 'atf-lrc-2' with browser dimension 1600 x 700
        And data for 'atf-lrc-1' present in the performance hints tables
        And data for 'atf-lrc-2' present in the performance hints tables
        And I am logged in 
        And I go to 'atf-lrc-1'
        When clear performance hints for this URL is clicked in admin bar
        Then data for 'atf-lrc-1' is removed from the performance hints tables
        Then data for 'atf-lrc-2' present in the performance hints tables
    
    Scenario: C16388 - Should clear performance hints of the URL when edited
        Given I log out
        And I visit beacon driven page 'atf-lrc-1' with browser dimension 1600 x 700
        And data for 'atf-lrc-1' present in the performance hints tables
        And I am logged in 
        And I go to 'atf-lrc-1'
        When I edit the content of post
        Then data for 'atf-lrc-1' is removed from the performance hints tables

    Scenario: C16388 - Should clear performance hints of the URL when deleted
        Given I log out
        And I visit beacon driven page 'atf-lrc-1' with browser dimension 1600 x 700
        And data for 'atf-lrc-1' present in the performance hints tables
        And I am logged in
        When 'atf-lrc-1' page is deleted
        Then data for 'atf-lrc-1' is removed from the performance hints tables
        Then untrash and republish 'atf-lrc-1' page