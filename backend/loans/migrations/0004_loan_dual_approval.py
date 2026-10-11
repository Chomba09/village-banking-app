from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('loans', '0003_loan_submitted_by_treasurer'),
    ]

    operations = [
        migrations.AddField(
            model_name='loan',
            name='treasurer_approved',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='loan',
            name='chairperson_approved',
            field=models.BooleanField(default=False),
        ),
    ]