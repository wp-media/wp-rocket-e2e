@smoke @local @setup @cache
Feature: C383 - Cache should not be cleared when admin refreshes the page

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated

    Scenario: Admin page refresh does not clear homepage cache
        Given I log out
        And I visit site url
        Then homepage cache should exist
        When I am logged in
        And I refresh admin
        Then homepage cache should not be regenerated
