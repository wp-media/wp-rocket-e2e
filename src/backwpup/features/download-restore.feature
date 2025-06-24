@bwpsetup @bwpdownloadrestore @bwupsmoke
Feature: BackWpUp Download and Restore

    Scenario: Should download backup
        Given I am logged in
        And I delete backwpup plugin
        And plugin is installed 'backwpup-pro'
        And plugin is activated
        Given First backup generated with default settings and local storage
        Then I should see 'mixed' job cards
        And I successfully download first backup in the history

# Scenario: Should restore backup