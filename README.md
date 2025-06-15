# shared-components

## Committing Changes from a Submodule

If you make changes to files in this submodule, follow these steps to ensure your changes are properly committed and referenced in the main repository:

1. **Commit and push changes in the submodule:**
   ```sh
   git add <changed-files>
   git commit -m "Describe your changes"
   git push
   ```
2. **Update the submodule reference in the main repository:**
   ```sh
   cd ../..
   git add src/shared-components
   git commit -m "Update shared-components submodule"
   git push
   ```

This ensures your changes to the submodule are tracked and referenced correctly in the main repository. 