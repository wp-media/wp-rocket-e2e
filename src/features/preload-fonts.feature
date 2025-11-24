@preloadfonts @setup @priorityelements
Feature: Beacon script captures the fonts ATF

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'media' 'preloadFonts'

    Scenario: Beacon captures expected atf fonts in desktop
        Given I log out
        And I visit the urls for preload fonts
        Then preload fonts should be as expected

