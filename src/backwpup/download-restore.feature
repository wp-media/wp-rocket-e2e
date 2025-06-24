@bwpsetup @bwpdownloadrestore @bwupsmoke
Feature: BackWpUp Download and Restore

    Background:
        Given I am logged in
        And I delete backwpup plugin
        And plugin is installed 'backwpup-pro'
        And plugin is activated

    Scenario: Should download backup
        When I go '/wp-admin/admin.php?page=backwpup'
        And I click '.js-backwpup-onboarding-step-2' button to continue
        And I click '.js-backwpup-onboarding-step-3' button to continue
        When I Configure web server storage
        And I go '/wp-admin/admin.php?page=backwpup'
        Then I should see 'mixed' job cards
        And I successfully download first backup in the history

# Scenario: Should restore backup