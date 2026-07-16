@setup @smoke @local @cache 
Feature: Cache Clear

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated

    Scenario: Shouldn't clear cache when refresh admin
        Given I log out
        And I visit site url
        When I am logged in
        Then homepage cache should exist
        When I refresh WP Rocket settings
        Then homepage cache should not be regenerated