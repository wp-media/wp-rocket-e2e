@llcssbg
Feature: C13977 - Should have a fallback for browsers where JavaScript is disabled

    Scenario: Open the page template and compare to nowprocket with javascript disabled
        Given I am logged in
        And plugin is installed
        And plugin is activated
        When I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'media' 'lazyloadCssBgImg'
        Then I must not see any visual regression 'llcssNoJs'
        When I log in
        Then clean up
