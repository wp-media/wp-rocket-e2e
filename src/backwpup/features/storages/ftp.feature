@bwpup @bwpupsetup @bwpupstorage @bwpupsmoke @bwpupstorageftp

Feature: Should be able to work with FTP storage
  Background:
    Given I am logged in
    And I delete backwpup plugin
    And plugin is installed 'backwpup-pro'
    And plugin is activated
    And I go '/wp-admin/admin.php?page=backwpup'
    When I click '.js-backwpup-onboarding-step-2' button to continue
    And I click '.js-backwpup-onboarding-step-3' button to continue

  Scenario: Setup FTP in Onboarding
    When I set up 'ftp' storage for first backup
    Then 'ftp' storage should be selected for first backup
    Then I save and submit the onboarding form
    And I go '/wp-admin/admin.php?page=backwpup'
    Then I should see 'mixed' job cards

  Scenario: Setup FTP from Dashboard (After Onboarding)
    When I Configure web server storage
    And I go '/wp-admin/admin.php?page=backwpup'
    Then I should see 'mixed' job cards
    And I set up 'ftp' storage
    Then 'ftp' storage should be selected
    When I click on manual backup of a job
    Then '2' backup is generated and added to history