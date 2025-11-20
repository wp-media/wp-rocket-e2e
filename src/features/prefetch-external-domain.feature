@prefetchexternal @setup @priorityelements
Feature: Beacon script captures the prefetch external domains

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
@test
    Scenario: Beacon captures expected external domains
        Given I log out
        And I visit the urls for prefetch External Domain
        Then domains should be as expected 

