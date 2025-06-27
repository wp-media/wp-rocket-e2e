@bwpsetup @bwpplugindeletion @bwpupsmoke
Feature: Should successfully delete BackWPup plugin

    Background:
        Given I am logged in

    Scenario: Should delete the plugin successfully after install
        Given plugin is installed 'backwpup-pro'
        When I delete backwpup plugin
        Then backwpup should delete successfully

    Scenario: Should delete the plugin successfully after activate
        Given plugin is installed 'backwpup-pro'
        And plugin is activated
        When I delete backwpup plugin
        Then backwpup should delete successfully

    Scenario: Should delete the plugin successfully after 1st backup
        Given plugin is installed 'backwpup-pro'
        And plugin is activated
        When I go '/wp-admin/admin.php?page=backwpup'
        And I click '.js-backwpup-onboarding-step-2' button to continue
        And I click '.js-backwpup-onboarding-step-3' button to continue
        When I Configure web server storage
        And I go '/wp-admin/admin.php?page=backwpup'
        And I should see 'mixed' job cards
        When I delete backwpup plugin
        Then backwpup should delete successfully