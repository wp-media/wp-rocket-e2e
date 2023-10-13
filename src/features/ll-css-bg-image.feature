@llcssbg
Feature: C13969 - Should lazyload CSS background images inside internal, and external CSS

    Background:
        Given I am logged in

    Scenario: Open the page template and compare to nowprocket
        Given plugin is installed
        And plugin is activated
        When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'media' 'lazyloadCssBgImg'
        Then I must not see any visual regression 'llcss'
        Then I must not see any error in debug.log
        When I log out
        Then no error in the console different than nowprocket page