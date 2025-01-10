@setup @delaylcp @performancehints
Feature: Clear lcp/performance hints data tests

    Background:
        Given I am logged in

    Scenario: When I change site homepage to page with links
        When I go '/wp-admin/options-reading.php'
        And I changed homepage to 'homepage_10URLs'
        Given plugin is installed 'new_release'
        And plugin is activated
        And I log out
        When I visit site url
        Then homepage and n URLs is added to Database

    Scenario: Shouldn't cause error if no links in home page
        Given I am logged in
        When I go '/wp-admin/options-reading.php'
        And I changed homepage to 'homepage_noURLs'
        When clear performance hints is clicked in admin bar
        Then I must not see any error in debug.log
        And only homepage is added to Database



    #Scenario: C16387 - Should clear performance hints data when click clear PH in admin bar
    #    Given performance hints data added to DB
    #    When clear performance hints is clicked in admin bar
    #    Then data is removed from the performance hints tables
  
    #Scenario: C16389 - Should clear performance hints when change permalinks
    #    Given performance hints data added to DB
    #    When permalink structure is changed to '/%postname%'
    #    Then data is removed from the performance hints tables
    
    #Scenario: C16390 - Should clear performance hints when switch theme
    #    Given performance hints data added to DB
    #    And switching the theme
    #    Then data is removed from the performance hints tables

    #Scenario: Should clear performance hints of the current URL
    #    Given I log out
    #    And I visit beacon driven page 'atf-lrc-1' with browser dimension 1600 x 700
    #    And I visit beacon driven page 'atf-lrc-2' with browser dimension 1600 x 700
    #    And data for 'atf-lrc-1' present in the performance hints tables
    #    And data for 'atf-lrc-2' present in the performance hints tables
    #    And I am logged in
    #    And I go to 'atf-lrc-1'
    #    When clear performance hints for this URL is clicked in admin bar
    #    Then data for 'atf-lrc-1' is removed from the performance hints tables
    #    Then data for 'atf-lrc-2' present in the performance hints tables
    
    #Scenario: C16388 - Should clear performance hints of the URL when edited
    #    Given I log out
    #    And I visit beacon driven page 'atf-lrc-1' with browser dimension 1600 x 700
    #    And data for 'atf-lrc-1' present in the performance hints tables
    #    And I am logged in
    #    And I go to 'atf-lrc-1'
    #    When I edit the content of post
    #    Then data for 'atf-lrc-1' is removed from the performance hints tables

    #Scenario: C16388 - Should clear performance hints of the URL when deleted
    #    Given I log out
    #    And I visit beacon driven page 'atf-lrc-1' with browser dimension 1600 x 700
    #    And data for 'atf-lrc-1' present in the performance hints tables
    #    And I am logged in
    #    When 'atf-lrc-1' page is deleted
    #    Then data for 'atf-lrc-1' is removed from the performance hints tables
    #    Then untrash and republish 'atf-lrc-1' page